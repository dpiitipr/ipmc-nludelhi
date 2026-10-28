import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const COOKIE = 'team_session';
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 12,
};

export const signSession = (id: string, code: string) =>
  new SignJWT({ id, code }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('12h').sign(key());

export async function readSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { id: String(payload.id), code: String(payload.code || '') };
  } catch {
    return null;
  }
}