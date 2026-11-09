import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { hg } from '@/lib/hygraph-server';
import { getAuth } from '@/lib/google';
import {
  SLOTS, type Slot, getWindow, redis, recKey, countedMs, receivedMs, lateHoursAt, type Rec,
} from '@/lib/memorial';

const fmt = (ms: number) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(new Date(ms)) + ' IST';

const sheetsClient = () =>
  google.sheets({ version: 'v4', auth: getAuth(['https://www.googleapis.com/auth/spreadsheets']) as any });

let tabName: string | null = null;
async function firstTab(id: string) {
  if (tabName) return tabName;
  const m = await sheetsClient().spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties.title' });
  tabName = m.data.sheets?.[0]?.properties?.title || 'Sheet1';
  return tabName;
}

// throws on failure, so the debug route can show the real reason
export async function sheetAppend(values: (string | number)[][]) {
  const id = process.env.MEMORIAL_SHEET_ID;
  if (!id) throw new Error('MEMORIAL_SHEET_ID is not set');
  const tab = await firstTab(id);
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: id,
    range: `'${tab}'!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

export async function notifyMemorial(teamCode: string, slot: string) {
  try {
    const w = await getWindow();
    const r = await redis().get<Rec>(recKey(teamCode, slot as Slot));
    if (!w || !r || r.status !== 'done') return;

    const rec = countedMs(r, w);
    const rcv = receivedMs(r);
    const late = lateHoursAt(rec, w);

    let university = '';
    let emails: string[] = [];
    try {
      const d: any = await hg.request(
        `query($c:String!){ team(where:{teamCode:$c}){ universityName participants{ email } } }`,
        { c: teamCode }
      );
      university = d.team?.universityName ?? '';
      emails = Array.from(new Set((d.team?.participants ?? []).map((p: any) => String(p.email || '').trim().toLowerCase()).filter(Boolean)));
    } catch (e) { console.error('notify: team lookup', e); }

    try {
      await sheetAppend([[
        fmt(Date.now()), teamCode, university, SLOTS[slot as Slot].label, r.name || '',
        fmt(rec), fmt(rcv), late, (r as any).fileId || '',
      ]]);
    } catch (e) { console.error('notify: sheet append failed', e); }

    // one email per team, only once all four files are in
    const slots = Object.keys(SLOTS) as Slot[];
    const recs = await redis().mget<(Rec | null)[]>(...slots.map((s) => recKey(teamCode, s)));
    if (!recs.every((x) => x?.status === 'done') || emails.length === 0) return;
    const first = await redis().set(`memo:mailed:${teamCode}`, 1, { nx: true });
    if (!first) return;

    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const lines = slots.map((s, i) => {
      const x = recs[i]!;
      const l = lateHoursAt(countedMs(x, w), w);
      return `${SLOTS[s].label}: ${x.name}\n   Recorded ${fmt(countedMs(x, w))} · Fully received ${fmt(receivedMs(x))}${l > 0 ? ` · Late by ${l} hour(s)` : ' · On time'}`;
    });
    await t.sendMail({
      from: `"Vidhi Pragati IPMC" <${process.env.SMTP_USER}>`,
      to: emails,
      bcc: process.env.SMTP_USER,
      subject: `Memorials received: team ${teamCode}`,
      text: `Your memorial submission for Vidhi Pragati has been received.\n\nTeam code: ${teamCode}\n\n${lines.join('\n\n')}\n\nSubmissions are final. Keep this email as your receipt. You can download your files from your team portal.`,
    });
  } catch (e) { console.error('notifyMemorial failed', e); }
}