import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSlot, extOf, MIME, recKey, redis, getDrive, type Rec } from '@/lib/memorial';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await readSession();
  if (!session?.code) return new NextResponse('Please sign in again.', { status: 401 });

  const slot = new URL(req.url).searchParams.get('slot');
  if (!isSlot(slot)) return new NextResponse('Invalid file.', { status: 400 });

  const rec = await redis().get<Rec>(recKey(session.code, slot)); // keyed by the signed-in team
  if (!rec || rec.status !== 'done' || !rec.fileId) return new NextResponse('Not found.', { status: 404 });

  try {
    const r = await getDrive().files.get(
      { fileId: rec.fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    const name = rec.name || `${session.code}_${slot}`;
    return new Response(Readable.toWeb(r.data as Readable) as ReadableStream, {
      headers: {
        'Content-Type': MIME[extOf(name)] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('Memorial download failed:', err);
    return new NextResponse('Could not open the file.', { status: 500 });
  }
}