import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get('k');
  if (!process.env.PREVIEW_KEY || k !== process.env.PREVIEW_KEY) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

  const info: Record<string, unknown> = {
    email,
    folder,
    keyLength: raw.length,
    startsWithBegin: raw.trim().startsWith('-----BEGIN PRIVATE KEY-----'),
    startsWithQuote: /^["']/.test(raw.trim()),
    endsWithEnd: /END PRIVATE KEY-----(\\n|\n)?["']?\s*$/.test(raw.trim()),
    hasLiteralBackslashN: raw.includes('\\n'),
    hasRealNewlines: raw.includes('\n'),
    vercelEnv: process.env.VERCEL_ENV || 'not on vercel',
  };

  try {
    const key = raw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    const jwt = new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    await jwt.authorize();
    info.signIn = 'OK';

    const drive = google.drive({ version: 'v3', auth: jwt });
    const r = await drive.files.get({
      fileId: folder,
      fields: 'id,name,driveId',
      supportsAllDrives: true,
    });
    info.folderName = r.data.name;
    info.sharedDriveId = r.data.driveId || 'none (My Drive)';
  } catch (e: any) {
    info.signIn = 'FAILED';
    info.reason =
      e?.response?.data?.error_description ||
      e?.response?.data?.error?.message ||
      e?.message ||
      String(e);
  }

  return NextResponse.json(info);
}