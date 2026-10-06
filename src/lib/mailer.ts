import nodemailer from 'nodemailer';

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const row = (label: string, value: unknown) =>
  `<tr>
    <td style="padding:6px 12px;border:1px solid #d9d2b0;background:#f5efc6;font-weight:600;width:38%">${esc(label)}</td>
    <td style="padding:6px 12px;border:1px solid #d9d2b0">${esc(value) || '—'}</td>
  </tr>`;

const table = (rows: string) =>
  `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:8px 0 20px">${rows}</table>`;

const heading = (t: string) =>
  `<h3 style="font-family:Georgia,serif;color:#4D0E12;margin:24px 0 4px">${esc(t)}</h3>`;

function person(d: Record<string, string>, p: 'sp1' | 'sp2' | 'res') {
  return table(
    row('Full name', d[`${p}Name`]) +
      row('Course', d[`${p}Course`]) +
      row('Year of study', d[`${p}Year`]) +
      row('Gender', d[`${p}Gender`]) +
      row('Contact number', d[`${p}Contact`]) +
      row('Email', d[`${p}Email`]) +
      row('LinkedIn', d[`${p}Linkedin`]) +
      row('Formal photo', 'Uploaded')
  );
}

export function recipientsFrom(d: Record<string, string>) {
  const all = [d.pocEmail, d.sp1Email, d.sp2Email, d.resEmail, d.deanEmail]
    .map((e) => (e || '').trim())
    .filter(Boolean);
  // dedupe, case-insensitive
  return [...new Map(all.map((e) => [e.toLowerCase(), e])).values()];
}

export async function sendRegistrationCopy(d: Record<string, string>) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error('SMTP env vars missing.');

  const to = recipientsFrom(d);
  if (to.length === 0) return { sent: false as const };

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const submitted = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
  <div style="font-family:Arial,sans-serif;color:#231815;max-width:680px;margin:auto">
    <h2 style="font-family:Georgia,serif;color:#4D0E12;margin-bottom:4px">Registration received</h2>
    <p style="margin-top:0">Vidhi Pragati National IP Moot Court Competition. Submitted on ${esc(submitted)} IST.</p>
    <p>This is a copy of the details submitted for <strong>${esc(d.university)}</strong>. Please check them and reply to this email if anything needs correcting.</p>

    ${heading('Institution')}
    ${table(
      row('Institution', d.university) +
        row('Address', d.address) +
        row('Dean, HOD or MCC coordinator', d.deanName) +
        row('Dean, HOD or MCC email', d.deanEmail) +
        row('Student contact (phone)', d.pocContact) +
        row('Student contact (email)', d.pocEmail) +
        row('Bona-fide letter', 'Uploaded')
    )}

    ${heading('Speaker 1')}${person(d, 'sp1')}
    ${heading('Speaker 2')}${person(d, 'sp2')}
    ${heading('Researcher')}${person(d, 'res')}

    <p style="font-size:12px;color:#555">National Law University Delhi · DPIIT IPR Chair</p>
  </div>`;

  await transporter.sendMail({
    from: `"Vidhi Pragati IPMC" <${SMTP_USER}>`,
    to, // one email, everyone in To
    replyTo: SMTP_USER,
    subject: `Registration received: ${d.university}`,
    html,
    text: `Registration received for ${d.university}. Please view this email in an HTML-capable client to see the full details.`,
  });

  return { sent: true as const, to };
}