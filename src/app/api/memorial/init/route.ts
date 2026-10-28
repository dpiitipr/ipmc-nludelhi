import { NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import {
  SLOTS, MIME, MAX_BYTES, HARD_CLOSE_HOURS, SESSION_SECONDS, getWindow, isSlot, extOf,
  recKey, redis, teamFolder, authClient, withRetry, type Rec,
} from '@/lib/memorial';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const now = Date.now(); // the moment that matters is stamped first
  const session = await readSession();
  if (!session?.code) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const slot = b.slot;
  const fileName = String(b.fileName || '');
  const size = Number(b.size || 0);
  if (!isSlot(slot)) return NextResponse.json({ error: 'Invalid file slot.' }, { status: 400 });

  const ext = extOf(fileName);
  if (!(SLOTS[slot].exts as readonly string[]).includes(ext)) {
    return NextResponse.json({ error: `This slot takes ${SLOTS[slot].exts.join(' or ').toUpperCase()} only.` }, { status: 400 });
  }
  if (!size || size > MAX_BYTES) return NextResponse.json({ error: 'The file must be under 50 MB.' }, { status: 400 });

  const w = await getWindow();
  if (!w || now < w.opensAt) {
    return NextResponse.json({ error: 'Memorial submission has not opened yet.' }, { status: 403 });
  }
  if (now > w.deadline + HARD_CLOSE_HOURS * 3600000) {
    return NextResponse.json({ error: 'Submission is closed. Memorials more than 24 hours late are not evaluated.' }, { status: 403 });
  }

  const code = session.code;
  const r = redis();
  const key = recKey(code, slot);

  // Save the start time first. Nothing after this can cost the team its time.
  const fresh: Rec = { status: 'started', startedAt: now };
  const claimed = await r.set(key, fresh, { nx: true, ex: SESSION_SECONDS });
  if (!claimed) {
    const existing = await r.get<Rec>(key);
    if (existing?.status === 'done') {
      return NextResponse.json({ error: 'This file is already submitted. Submissions are final.' }, { status: 409 });
    }
    if (!existing) await r.set(key, fresh, { ex: SESSION_SECONDS });
    // an unfinished earlier attempt keeps its original start time
  }

  try {
    const folderId = await teamFolder(code);
    const { token } = await authClient().getAccessToken();
    const origin = req.headers.get('origin');

    const res = await withRetry(async () => {
      const x = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': MIME[ext],
            'X-Upload-Content-Length': String(size),
            ...(origin ? { Origin: origin } : {}),
          },
          body: JSON.stringify({ name: fileName, parents: [folderId], appProperties: { slot, teamCode: code } }),
        }
      );
      if (!x.ok && [403, 429, 500, 502, 503].includes(x.status)) throw { code: x.status };
      return x;
    });

    const uploadUrl = res.headers.get('location');
    if (!res.ok || !uploadUrl) throw new Error('Drive refused the session: ' + (await res.text()).slice(0, 200));
    return NextResponse.json({ uploadUrl, mime: MIME[ext] });
  } catch (err) {
    console.error('Memorial init failed:', err);
    return NextResponse.json(
      { error: 'Could not start the upload. Please press submit again. Your original submit time is saved.' },
      { status: 500 }
    );
  }
}