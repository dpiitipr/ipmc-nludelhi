import { NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/drive';

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
    const file = fd.get('file');
    const kind = String(fd.get('kind') || '') as keyof typeof RULES;
    const label = clean(String(fd.get('label') || 'file'));
    const university = clean(String(fd.get('university') || 'unknown'));

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
    const name = `${university}__${label}__${Date.now()}.${EXT[file.type]}`;
    const result = await uploadToDrive({ name, mimeType: file.type, buffer });

    return NextResponse.json({ url: result.url, name: result.name });
  } catch (err) {
    console.error('Drive upload failed:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}