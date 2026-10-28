import { NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSlot, extOf, baseOf, expectedBase, recKey, redis, teamFolder, getDrive, withRetry, type Rec } from '@/lib/memorial';

export const runtime = 'nodejs';
export const maxDuration = 30;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FIELDS = 'id,name,size,createdTime,parents,appProperties';

export async function POST(req: Request) {
  const receivedAt = Date.now();
  const session = await readSession();
  if (!session?.code) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const slot = body.slot;
  const fileIdIn = typeof body.fileId === 'string' ? body.fileId : null;
  if (!isSlot(slot)) return NextResponse.json({ error: 'Invalid file slot.' }, { status: 400 });

  const code = session.code;
  const r = redis();
  const key = recKey(code, slot);
  const rec = await r.get<Rec>(key);
  if (!rec) return NextResponse.json({ error: 'This upload was not started or took too long. Please try again.' }, { status: 404 });
  if (rec.status === 'done') return NextResponse.json({ ok: true });

  try {
    const folder = await teamFolder(code);
    const drive = getDrive();
    let file: any = null;

    if (fileIdIn) {
      file = (await withRetry(() => drive.files.get({ fileId: fileIdIn, fields: FIELDS, supportsAllDrives: true }))).data;
    } else {
      for (let i = 0; i < 6 && !file; i++) {
        const l = await withRetry(() =>
          drive.files.list({
            q: `appProperties has { key='slot' and value='${slot}' } and '${folder}' in parents and trashed=false`,
            fields: `files(${FIELDS})`, pageSize: 5,
            corpora: 'allDrives', supportsAllDrives: true, includeItemsFromAllDrives: true,
          })
        );
        file = l.data.files?.[0] ?? null;
        if (!file) await sleep(1500);
      }
    }

    if (!file || !file.parents?.includes(folder) || file.appProperties?.slot !== slot) {
      return NextResponse.json({ error: 'We did not receive the file. Please press submit again. Your original submit time is saved.' }, { status: 404 });
    }

    // Soft check: flag, never reject, so a quirk can't cost anyone their submission
    let suspect = false;
    try {
      const ext = extOf(file.name || '');
      const head = await drive.files.get(
        { fileId: file.id, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer', headers: { Range: 'bytes=0-7' } }
      );
      const bytes = Buffer.from(head.data as ArrayBuffer);
      suspect = !(
        ext === 'pdf' ? bytes.subarray(0, 5).toString('latin1') === '%PDF-'
        : ext === 'docx' ? bytes[0] === 0x50 && bytes[1] === 0x4b
        : bytes.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))
      );
    } catch {
      /* skip the check */
    }

    const done: Rec = {
      ...rec,
      status: 'done',
      receivedAt,
      driveCreated: file.createdTime,
      fileId: file.id,
      name: file.name,
      size: Number(file.size || 0),
      nameOk: baseOf(file.name || '') === expectedBase(code, slot),
      suspect,
    };
    await r.set(key, done); // no expiry: this is the permanent record
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Memorial complete failed:', err);
    return NextResponse.json({ error: 'Could not confirm the upload. Please press submit again. Your original submit time is saved.' }, { status: 500 });
  }
}