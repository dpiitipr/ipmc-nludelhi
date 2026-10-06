import { NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/drive';
import { registrationState } from '@/lib/schedule';
import { INVITED_INSTITUTIONS } from '@/lib/institutions';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // stay under Vercel's 4.5 MB body limit

const RULES = {
  photo: { types: ['image/jpeg', 'image/png', 'image/webp'], label: 'JPG, PNG or WebP' },
  bonafide: { types: ['application/pdf', 'image/jpeg', 'image/png'], label: 'PDF, JPG or PNG' },
} as const;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const clean = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    // Launch guard, with the private preview key as the only bypass
    const previewOk = !!process.env.PREVIEW_KEY && fd.get('preview') === process.env.PREVIEW_KEY;
    const state = registrationState();
    if (state !== 'open' && !previewOk) {
      return NextResponse.json(
        { error: state === 'before' ? 'Registration has not opened yet.' : 'Registration is closed.' },
        { status: 403 }
      );
    }

    const file = fd.get('file');
    const kind = String(fd.get('kind') || '') as keyof typeof RULES;
    const label = clean(String(fd.get('label') || 'file'));
    const universityRaw = String(fd.get('university') || '');
    const university = clean(universityRaw || 'unknown');

    if (!(INVITED_INSTITUTIONS as readonly string[]).includes(universityRaw)) {
      return NextResponse.json({ error: 'Please select your institution first.' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    }
    if (!RULES[kind]) {
      return NextResponse.json({ error: 'Invalid upload type.' }, { status: 400 });
    }
    if (!(RULES[kind].types as readonly string[]).includes(file.type)) {
      return NextResponse.json({ error: `Only ${RULES[kind].label} allowed.` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is larger than 4 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const prefix = previewOk && state !== 'open' ? 'PREVIEW__' : '';
    const name = `${prefix}${university}__${label}__${Date.now()}.${EXT[file.type]}`;
    const result = await uploadToDrive({ name, mimeType: file.type, buffer });

    return NextResponse.json({ url: result.url, name: result.name });
  } catch (err: any) {
    const g = err?.response?.data?.error;
    const reason = g?.errors?.[0]?.reason || g?.status || err?.code || '';
    const detail = g?.message || err?.message || String(err);
    console.error('Drive upload failed:', reason, detail, g || '');

    let message = 'Upload failed. Please try again.';
    if (reason === 'storageQuotaExceeded') message = 'Server storage is not configured (Drive quota).';
    else if (reason === 'notFound' || err?.code === 404) message = 'Server cannot find the upload folder.';
    else if (/invalid_grant|DECODER|PEM|private key/i.test(detail)) message = 'Server Google key is invalid.';
    else if (/Missing|env/i.test(detail)) message = 'Server Google settings are missing.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}