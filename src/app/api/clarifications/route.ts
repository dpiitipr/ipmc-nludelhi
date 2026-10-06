import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/*
  Env vars (set in Vercel and in .env.local):
    CLARIFICATION_SHEET_URL     the Google Apps Script web app URL (ends in /exec)
    CLARIFICATION_SHEET_SECRET  the same secret string you put in the Apps Script
*/

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const sheetUrl = process.env.CLARIFICATION_SHEET_URL;
  const secret = process.env.CLARIFICATION_SHEET_SECRET ?? '';

  if (!sheetUrl) {
    console.error('CLARIFICATION_SHEET_URL is not set');
    return NextResponse.json(
      { error: 'This form is not available right now. Please email the organising committee.' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success so they move on.
  if (clean(body.hp_check, 50)) {
    return NextResponse.json({ ok: true });
  }

  const payload = {
    name: clean(body.name, 1000),
    email: clean(body.email, 1000),
    institution: clean(body.institution, 1000),
    reference: clean(body.reference, 1000),
    // A Google Sheets cell holds at most 50,000 characters, so stay just under it
    question: clean(body.question, 49000),
  };

  if (!payload.name || !payload.email || !payload.institution || !payload.question) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }
  if (!EMAIL.test(payload.email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    const res = await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, secret }),
      redirect: 'follow', // Apps Script answers through a redirect
      cache: 'no-store',
    });

    const text = await res.text();
    let result: any = null;
    try {
      result = JSON.parse(text);
    } catch {
      /* not JSON, handled below */
    }

    if (!res.ok || !result?.ok) {
      console.error('Sheet write failed:', res.status, text.slice(0, 300));
      return NextResponse.json(
        { error: 'We could not record your request. Please try again in a moment.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sheet request error:', err);
    return NextResponse.json(
      { error: 'We could not record your request. Please try again in a moment.' },
      { status: 502 }
    );
  }
}