import { google } from 'googleapis';
import { Readable } from 'stream';

function getDrive() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function uploadToDrive(opts: {
  name: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name: opts.name,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: { mimeType: opts.mimeType, body: Readable.from(opts.buffer) },
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  });
  return { id: res.data.id!, name: res.data.name!, url: res.data.webViewLink! };
}