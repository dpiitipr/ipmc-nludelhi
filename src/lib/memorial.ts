import { google } from 'googleapis';
import { Redis } from '@upstash/redis';
import { getAuth } from '@/lib/google';
import { hg } from '@/lib/hygraph-server';

/* ---------- Memorial slots ---------- */

export const SLOTS = {
  P_pdf: {
    label: 'Plaintiff memorial (PDF)',
    letter: 'P',
    exts: ['pdf'],
  },
  P_word: {
    label: 'Plaintiff memorial (Word)',
    letter: 'P',
    exts: ['doc', 'docx'],
  },
  D_pdf: {
    label: 'Defendant memorial (PDF)',
    letter: 'D',
    exts: ['pdf'],
  },
  D_word: {
    label: 'Defendant memorial (Word)',
    letter: 'D',
    exts: ['doc', 'docx'],
  },
} as const;

export type Slot = keyof typeof SLOTS;

export const isSlot = (s: unknown): s is Slot =>
  typeof s === 'string' &&
  Object.prototype.hasOwnProperty.call(SLOTS, s);

/* ---------- File configuration ---------- */

export const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const MAX_BYTES = 50 * 1024 * 1024;

export const HARD_CLOSE_HOURS = 24;

export const SESSION_SECONDS = 20 * 60;

/* ---------- Submission records ---------- */

export type Rec = {
  status: 'started' | 'done';

  startedAt: number;

  receivedAt?: number;

  driveCreated?: string;

  fileId?: string;

  name?: string;

  size?: number;

  nameOk?: boolean;

  suspect?: boolean;
};

export const recKey = (code: string, slot: string) =>
  `memo:rec:${code}:${slot}`;

export const receivedMs = (r: Rec) =>
  r.driveCreated
    ? +new Date(r.driveCreated)
    : r.receivedAt ?? r.startedAt;

export const extOf = (n: string) =>
  (n.split('.').pop() || '').toLowerCase();

export const baseOf = (n: string) =>
  n.replace(/\.[^.]+$/, '');

export const expectedBase = (code: string, slot: Slot) =>
  `${code}_${SLOTS[slot].letter}`;

/* ---------- Redis ---------- */

let _redis: Redis | null = null;

export const redis = (): Redis => {
  if (_redis) return _redis;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Redis is not configured. Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    );
  }

  _redis = new Redis({
    url,
    token,
  });

  return _redis;
};

/* ---------- Memorial submission window ---------- */

export type Win = {
  opensAt: number;
  deadline: number;
  graceMs: number;
  countStart: boolean;
};

/**
 * Retrieves the submission window.
 *
 * Redis is used only as a cache for this function.
 * If Redis is unavailable, the function queries Hygraph directly.
 *
 * Returns both the window and any relevant error.
 */
export async function getWindowDetailed(): Promise<{
  win: Win | null;
  error?: string;
}> {
  let r: Redis | null = null;

  // 1. Initialise Redis if available.
  try {
    r = redis();
  } catch {
    r = null;
  }

  // 2. Try cached window.
  if (r) {
    try {
      const cached = await r.get<Win>('memo:window');

      if (cached) {
        return { win: cached };
      }
    } catch (err) {
      console.error(
        'Memorial Redis cache unavailable:',
        err
      );
    }
  }

  // 3. Fetch primary window information from Hygraph.
  try {
    const data = await hg.request<{
      memoWindows: {
        opensAt: string;
        deadline: string;
      }[];
    }>(`
      {
        memoWindows(first: 1) {
          opensAt
          deadline
        }
      }
    `);

    const w = data.memoWindows?.[0];

    if (!w?.opensAt || !w?.deadline) {
      throw new Error(
        'Hygraph returned no MemoWindow. The entry may be unpublished or the API token may lack permission.'
      );
    }

    const opensAt = new Date(w.opensAt).getTime();

    const deadline = new Date(w.deadline).getTime();

    if (
      !Number.isFinite(opensAt) ||
      !Number.isFinite(deadline) ||
      deadline <= opensAt
    ) {
      throw new Error(
        'Invalid memorial submission dates returned by Hygraph.'
      );
    }

    // 4. Fetch optional fields separately.
    // This prevents missing optional schema fields from
    // breaking the entire submission window query.

    let extra: {
      graceSeconds?: number | null;
      countTime?: string | null;
    } = {};

    try {
      const result = await hg.request<{
        memoWindows: {
          graceSeconds?: number | null;
          countTime?: string | null;
        }[];
      }>(`
        {
          memoWindows(first: 1) {
            graceSeconds
            countTime
          }
        }
      `);

      extra = result.memoWindows?.[0] ?? {};
    } catch (err) {
      console.warn(
        'Optional MemoWindow fields unavailable. Using defaults.',
        err
      );
    }

    // 5. Construct submission window.
    const graceSeconds = Number(
      extra.graceSeconds ?? 0
    );

    const win: Win = {
      opensAt,

      deadline,

      graceMs:
        Number.isFinite(graceSeconds)
          ? Math.max(0, graceSeconds) * 1000
          : 0,

      countStart: extra.countTime !== 'Received',
    };

    // 6. Cache for 30 seconds.
    if (r) {
      try {
        await r.set(
          'memo:window',
          win,
          { ex: 30 }
        );

        // Last known valid window.
        await r.set(
          'memo:window:last',
          win
        );
      } catch (err) {
        console.error(
          'Could not cache memorial window:',
          err
        );
      }
    }

    return { win };

  } catch (e: any) {
    const message =
      e?.response?.errors?.[0]?.message ||
      e?.message ||
      'Unable to retrieve memorial submission window.';

    console.error(
      'MemoWindow fetch failed:',
      message
    );

    // 7. Fall back to last known window.
    if (r) {
      try {
        const last = await r.get<Win>(
          'memo:window:last'
        );

        if (last) {
          return { win: last };
        }
      } catch (err) {
        console.error(
          'Could not retrieve last known memorial window:',
          err
        );
      }
    }

    return {
      win: null,
      error: message,
    };
  }
}

/**
 * Compatibility export.
 *
 * Existing API routes using getWindow()
 * continue working without modification.
 */
export const getWindow = async (): Promise<Win | null> =>
  (await getWindowDetailed()).win;

/* ---------- Submission timing ---------- */

export const countedMs = (r: Rec, w: Win) =>
  w.countStart
    ? r.startedAt
    : receivedMs(r);

/**
 * Calculate late penalty.
 *
 * Every commenced hour counts as a full hour.
 */
export const lateHoursAt = (
  ms: number,
  w: Win
) => {
  const over =
    ms - w.graceMs - w.deadline;

  return over > 0
    ? Math.ceil(over / 3600000)
    : 0;
};

/* ---------- Google Drive ---------- */

export const SCOPE =
  'https://www.googleapis.com/auth/drive';

let _auth: ReturnType<typeof getAuth> | null = null;

export const authClient = () =>
  (_auth ??= getAuth([SCOPE]));

export const getDrive = () =>
  google.drive({
    version: 'v3',
    auth: authClient(),
  });

const sleep = (ms: number) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, ms)
  );

/* ---------- Google API retry handling ---------- */

/**
 * Retries temporary Google API failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  tries = 4
): Promise<T> {
  let wait = 300;

  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const status = Number(
        e?.code || e?.response?.status
      );

      if (
        ![403, 429, 500, 502, 503, 504].includes(status) ||
        i >= tries - 1
      ) {
        throw e;
      }

      await sleep(
        wait + Math.random() * wait
      );

      wait *= 2;
    }
  }
}

/* ---------- Team folders ---------- */

/**
 * Team folders are normally created in advance by:
 *
 * scripts/make-memorial-folders.mjs
 *
 * This function locates the existing folder and
 * creates it only if missing.
 */
export async function teamFolder(
  code: string
): Promise<string> {
  const r = redis();

  const cacheKey = `memo:folder:${code}`;

  // 1. Check cached folder ID.
  const cached = await r.get<string>(cacheKey);

  if (cached) {
    return cached;
  }

  // 2. Acquire creation lock.
  const lock = await r.set(
    `memo:folderlock:${code}`,
    1,
    {
      nx: true,
      ex: 30,
    }
  );

  if (!lock) {
    await sleep(1500);

    const again = await r.get<string>(
      cacheKey
    );

    if (again) {
      return again;
    }

    throw new Error(
      'Folder is being created. Please try again.'
    );
  }

  // 3. Validate root folder configuration.
  const root =
    process.env.MEMORIAL_ROOT_FOLDER_ID;

  if (!root) {
    throw new Error(
      'MEMORIAL_ROOT_FOLDER_ID is not configured.'
    );
  }

  const drive = getDrive();

  // 4. Search for existing team folder.
  const found = await withRetry(() =>
    drive.files.list({
      q: `name='${code.replace(
        /'/g,
        "\\'"
      )}' and mimeType='application/vnd.google-apps.folder' and '${root}' in parents and trashed=false`,

      fields: 'files(id)',

      pageSize: 1,

      corpora: 'allDrives',

      supportsAllDrives: true,

      includeItemsFromAllDrives: true,
    })
  );

  let id =
    found.data.files?.[0]?.id ?? null;

  // 5. Create folder if missing.
  if (!id) {
    const created = await withRetry(() =>
      drive.files.create({
        requestBody: {
          name: code,

          mimeType:
            'application/vnd.google-apps.folder',

          parents: [root],
        },

        fields: 'id',

        supportsAllDrives: true,
      })
    );

    id = created.data.id ?? null;
  }

  if (!id) {
    throw new Error(
      'Could not locate or create the team folder.'
    );
  }

  // 6. Cache folder ID.
  await r.set(cacheKey, id);

  return id;
}