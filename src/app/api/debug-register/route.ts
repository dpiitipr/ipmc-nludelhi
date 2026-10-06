import { NextResponse } from 'next/server';
import { appendRow } from '@/lib/sheets';
import { sendRegistrationCopy } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get('k');
  if (!process.env.PREVIEW_KEY || k !== process.env.PREVIEW_KEY) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const out: Record<string, unknown> = {
    hasSheetId: !!process.env.GOOGLE_SHEET_ID,
    hasSmtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  };

  try {
    await appendRow(['TEST', new Date().toISOString()]);
    out.sheet = 'OK';
  } catch (e: any) {
    out.sheet = e?.response?.data?.error?.message || e?.message || String(e);
  }

  try {
    const r = await sendRegistrationCopy({
      university: 'TEST',
      pocEmail: process.env.SMTP_USER || '',
    } as any);
    out.email = r.sent ? 'OK' : 'no recipients';
  } catch (e: any) {
    out.email = e?.message || String(e);
  }

  return NextResponse.json(out);
}