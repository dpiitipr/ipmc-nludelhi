import { redis, recKey, SLOTS, type Slot } from '@/lib/memorial';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  if (u.searchParams.get('k') !== process.env.MEMORIAL_ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }
  const team = (u.searchParams.get('team') || '').trim();
  const slot = u.searchParams.get('slot'); // optional: P_pdf, P_word, D_pdf, D_word
  if (!team) return Response.json({ error: 'team is required' }, { status: 400 });

  const all = Object.keys(SLOTS) as Slot[];
  const targets = slot ? all.filter((s) => s === slot) : all;
  if (targets.length === 0) return Response.json({ error: 'unknown slot' }, { status: 400 });

  const keys = targets.map((s) => recKey(team, s));
  const deleted = await redis().del(...keys);
  return Response.json({ ok: true, team, reset: targets, deleted });
}