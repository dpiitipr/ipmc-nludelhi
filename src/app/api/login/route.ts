import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { hg } from '@/lib/hygraph-server';
import { COOKIE, cookieOptions, signSession } from '@/lib/session';
import { guardSubmission } from '@/lib/antispam';

export const runtime = 'nodejs';

const sha = (s: string) => createHash('sha256').update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const blocked = await guardSubmission(req, body, { name: 'login', limit: 10, window: '15 m', captcha: false });
  if (blocked) return blocked;

  const code = String(body.teamCode || '').trim();
  const password = String(body.password || '');
  if (!code || !password) {
    return NextResponse.json({ error: 'Enter your team code and password.' }, { status: 400 });
  }

  let team: { id: string; teamCode: string; password: string } | null = null;
  try {
    const r = await hg.request<{ team: { id: string; teamCode: string; password: string } | null }>(
      `query($c: String!) { team(where: { teamCode: $c }) { id teamCode password } }`,
      { c: code }
    );
    team = r.team;
  } catch (err) {
    console.error('Login lookup failed:', err);
    return NextResponse.json({ error: 'Could not sign in right now. Please try again.' }, { status: 500 });
  }

  // compare even when the team is unknown, so timing doesn't reveal valid codes
  const ok = same(password, team?.password ?? '\u0000no-such-team');
  if (!team || !ok) {
    return NextResponse.json({ error: 'Team code or password is incorrect.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await signSession(team.id, team.teamCode), cookieOptions);
  return res;
}