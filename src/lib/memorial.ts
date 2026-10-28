import { google } from 'googleapis';
import { Redis } from '@upstash/redis';
import { getAuth } from '@/lib/google';
import { hg } from '@/lib/hygraph-server';

export const SLOTS = {
  P_pdf: { label: 'Plaintiff memorial (PDF)', letter: 'P', exts: ['pdf'] },
  P_word: { label: 'Plaintiff memorial (Word)', letter: 'P', exts: ['doc', 'docx'] },
  D_pdf: { label: 'Defendant memorial (PDF)', letter: 'D', exts: ['pdf'] },
  D_word: { label: 'Defendant memorial (Word)', letter: 'D', exts: ['doc', 'docx'] },
} as const;
export type Slot = keyof typeof SLOTS;
export const isSlot = (s: unknown): s is Slot => typeof s === 'string' && s in SLOTS;

export const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
export const MAX_BYTES = 50 * 1024 * 1024;
export const HARD_CLOSE_HOURS = 24; // rule 7.1.3: not evaluated beyond this
export const SESSION_SECONDS = 20 * 60; // an upload must finish within 20 min of starting

export type Rec = {
  status: 'started' | 'done';
  startedAt: number; // server clock when the team pressed submit
  receivedAt?: number; // server clock when the upload was confirmed
  driveCreated?: string; // Drive's own timestamp for the file
  fileId?: string;
  name?: string;
  size?: number;
  nameOk?: boolean;
  suspect?: boolean; // did not look like a PDF or Word file: review manually
};

export const recKey = (code: string, slot: string) => `memo:rec:${code}:${slot}`;
export const receivedMs = (r: Rec) => (r.driveCreated ? +new Date(r.driveCreated) : r.receivedAt ?? r.startedAt);

export const extOf = (n: string) => (n.split('.').pop() || '').toLowerCase();
export const baseOf = (n: string) => n.replace(/\.[^.]+$/, '');
export const expectedBase = (code: string, slot: Slot) => `${code}_${SLOTS[slot].letter}`;

/* ---------- Redis ---------- */
let _redis: Redis | null = null;
export const redis = () =>
  (_redis ??= new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
  }));

/* ---------- deadline, read from Hygraph and cached for 30 seconds ---------- */
export type Win = { opensAt: number; deadline: number; graceMs: number; countStart: boolean };

export async function getWindow(): Promise<Win | null> {
  const r = redis();
  const cached = await r.get<Win>('memo:window');
  if (cached) return cached;

  // only one request refreshes it; the others use the last known value
  const gotLock = await r.set('memo:window:lock', 1, { nx: true, ex: 5 });
  if (!gotLock) return r.get<Win>('memo:window:last');

  try {
    const d: any = await hg.request(`{ memoWindows(first: 1) { opensAt deadline graceSeconds countTime } }`);
    const w = d.memoWindows?.[0];
    if (!w?.opensAt || !w?.deadline) throw new Error('MemoWindow is missing or unpublished');
    const win: Win = {
      opensAt: +new Date(w.opensAt),
      deadline: +new Date(w.deadline),
      graceMs: Number(w.graceSeconds || 0) * 1000,
      countStart: w.countTime !== 'Received',
    };
    await r.set('memo:window', win, { ex: 30 });
    await r.set('memo:window:last', win); // never expires: used if Hygraph is down
    return win;
  } catch (err) {
    console.error('MemoWindow fetch failed, using last known value:', err);
    return r.get<Win>('memo:window:last');
  }
}

export const countedMs = (r: Rec, w: Win) => (w.countStart ? r.startedAt : receivedMs(r));
export const lateHoursAt = (ms: number, w: Win) => {
  const over = ms - w.graceMs - w.deadline;
  return over > 0 ? Math.ceil(over / 3600000) : 0; // a started hour counts as a full hour
};

/* ---------- Drive ---------- */
export const SCOPE = 'https://www.googleapis.com/auth/drive';
let _auth: ReturnType<typeof getAuth> | null = null;
export const authClient = () => (_auth ??= getAuth([SCOPE]));
export const getDrive = () => google.drive({ version: 'v3', auth: authClient() });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retries when Google rate-limits or has a hiccup
export async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let wait = 300;
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const status = Number(e?.code || e?.response?.status);
      if (![403, 429, 500, 502, 503, 504].includes(status) || i >= tries - 1) throw e;
      await sleep(wait + Math.random() * wait);
      wait *= 2;
    }
  }
}

// Folders are created in advance by scripts/make-memorial-folders.mjs.
// This fallback only runs if a folder is missing.
export async function teamFolder(code: string): Promise<string> {
  const r = redis();
  const cacheKey = `memo:folder:${code}`;
  const cached = await r.get<string>(cacheKey);
  if (cached) return cached;

  const lock = await r.set(`memo:folderlock:${code}`, 1, { nx: true, ex: 30 });
  if (!lock) {
    await sleep(1500);
    const again = await r.get<string>(cacheKey);
    if (again) return again;
    throw new Error('Folder is being created');
  }

  const root = process.env.MEMORIAL_ROOT_FOLDER_ID!;
  const drive = getDrive();
  const found = await withRetry(() =>
    drive.files.list({
      q: `name='${code.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${root}' in parents and trashed=false`,
      fields: 'files(id)', pageSize: 1,
      corpora: 'allDrives', supportsAllDrives: true, includeItemsFromAllDrives: true,
    })
  );
  let id = found.data.files?.[0]?.id ?? null;
  if (!id) {
    const c = await withRetry(() =>
      drive.files.create({
        requestBody: { name: code, mimeType: 'application/vnd.google-apps.folder', parents: [root] },
        fields: 'id', supportsAllDrives: true,
      })
    );
    id = c.data.id ?? null;
  }
  if (!id) throw new Error('Could not create folder');
  await r.set(cacheKey, id);
  return id;
}