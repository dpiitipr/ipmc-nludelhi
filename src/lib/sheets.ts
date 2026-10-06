import { google } from 'googleapis';

export async function appendRow(row: string[]) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('Missing Google Sheets env vars.');
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Registrations!A1',
    valueInputOption: 'RAW', // stores text as-is, so a value starting with "=" or "+" can't become a formula
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}