import { google } from 'googleapis';
import { Readable } from 'stream';

const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/^"|"$/g, '').replace(/\\n/g, '\n');
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

try {
  const up = await drive.files.create({
    requestBody: { name: 'test-upload.txt', parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] },
    media: { mimeType: 'text/plain', body: Readable.from(Buffer.from('hello')) },
    fields: 'id,name,webViewLink',
    supportsAllDrives: true,
  });
  console.log('UPLOAD OK:', up.data.name);
} catch (e) {
  console.error('FAILED:', e?.response?.data?.error?.message || e.message);
}