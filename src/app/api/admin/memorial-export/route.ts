import { NextResponse } from 'next/server';
import { getWindow, lateHoursAt, receivedMs, redis, type Rec } from '@/lib/memorial';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ist = (ms?: number | string | null) =>
  ms
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium', hour12: false,
      }).format(new Date(ms))
    : '';
const csv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get('k');
  if (!process.env.MEMORIAL_ADMIN_KEY || k !== process.env.MEMORIAL_ADMIN_KEY) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const w = await getWindow();
  if (!w) return NextResponse.json({ error: 'MemoWindow not found' }, { status: 500 });

  const r = redis();
  const keys: string[] = await r.keys('memo:rec:*');
  const recs = keys.length ? await r.mget<(Rec | null)[]>(...keys) : [];

  const head = [
    'team', 'slot', 'status', 'file name', 'name ok', 'size bytes',
    'start time IST', 'received time IST', 'drive time IST',
    'late hours (by start)', 'late hours (by received)', 'review', 'drive file id',
  ];
  const rows = keys
    .map((key, i) => ({ key, rec: recs[i] }))
    .filter((x): x is { key: string; rec: Rec } => !!x.rec)
    .map(({ key, rec }) => {
      const [, , team, slot] = key.split(':');
      const done = rec.status === 'done';
      return [
        team, slot, rec.status, rec.name, done ? (rec.nameOk ? 'yes' : 'NO') : '', rec.size,
        ist(rec.startedAt), ist(rec.receivedAt), ist(rec.driveCreated),
        lateHoursAt(rec.startedAt, w), done ? lateHoursAt(receivedMs(rec), w) : '',
        rec.suspect ? 'CHECK FILE' : '', rec.fileId,
      ].map(csv).join(',');
    })
    .sort();

  return new NextResponse([head.join(','), ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="memorial-submissions.csv"',
    },
  });
}