import { NextResponse } from 'next/server';
import { registrationState } from '@/lib/schedule';
import { sendRegistrationCopy } from '@/lib/mailer';
import { appendRow } from '@/lib/sheets';

export const runtime = 'nodejs';

const emailOk = (e: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e ?? '').trim());

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Launch guard, with the private preview key as the only bypass
    const previewOk = !!process.env.PREVIEW_KEY && body.preview === process.env.PREVIEW_KEY;
    const state = registrationState();
    if (state !== 'open' && !previewOk) {
      return NextResponse.json(
        { error: state === 'before' ? 'Registration has not opened yet.' : 'Registration is closed.' },
        { status: 403 }
      );
    }

    // Required fields
    if (!body.university || !body.pocEmail || !body.sp1Name) {
      return NextResponse.json(
        { error: 'Missing required registration fields' },
        { status: 400 }
      );
    }

    const emails = [body.pocEmail, body.deanEmail, body.sp1Email, body.sp2Email, body.resEmail];
    if (!emails.every(emailOk)) {
      return NextResponse.json({ error: 'Please check the email addresses.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    const rowData: string[] = [
      timestamp,
      body.pocEmail,
      body.university,
      body.address,
      body.deanName,
      body.deanEmail,
      body.pocContact,
      body.pocEmail,
      body.bonafideUrl,

      // Speaker 1
      body.sp1Name, body.sp1Course, body.sp1Year, body.sp1Contact,
      body.sp1Email, body.sp1Gender, body.sp1PhotoUrl, body.sp1Linkedin,

      // Speaker 2
      body.sp2Name, body.sp2Course, body.sp2Year, body.sp2Contact,
      body.sp2Email, body.sp2Gender, body.sp2PhotoUrl, body.sp2Linkedin,

      // Researcher
      body.resName, body.resCourse, body.resYear, body.resContact,
      body.resEmail, body.resGender, body.resPhotoUrl, body.resLinkedin,
    ].map((v) => String(v ?? ''));

    // 1. Save. If this fails, the registration is not recorded, so report an error.
    if (process.env.GOOGLE_SHEET_ID) {
      await appendRow(previewOk && state !== 'open' ? ['PREVIEW', ...rowData] : rowData);
    } else {
      console.warn('GOOGLE_SHEET_ID not set: registration only logged.');
      console.log('Registration Submitted:', rowData);
    }

    // 2. Email. A mail failure never makes a saved registration look failed.
    let emailSent = false;
    try {
      const r = await sendRegistrationCopy(body);
      emailSent = r.sent;
    } catch (err) {
      console.error('Confirmation email failed:', err);
    }

    return NextResponse.json(
      { success: true, message: 'Registration recorded successfully.', emailSent },
      { status: 200 }
    );
  } catch (err) {
    console.error('Registration Route Error:', err);
    return NextResponse.json(
      { error: 'Failed to process registration.' },
      { status: 500 }
    );
  }
}