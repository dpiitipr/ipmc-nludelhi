import { google } from 'googleapis';

export function getAuth(scopes: string[]) {
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!email || !key) throw new Error('Missing Google env vars.');
  return new google.auth.JWT({ email, key, scopes });
}