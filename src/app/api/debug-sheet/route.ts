import { sheetAppend } from '@/lib/memorial-notify';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get('k') !== process.env.PREVIEW_KEY) return new Response('Unauthorized', { status: 401 });
  try { await sheetAppend([['TEST ROW', new Date().toISOString()]]); return Response.json({ ok: true }); }
  catch (e: any) { return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 }); }
}