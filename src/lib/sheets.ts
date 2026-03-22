import { google } from 'googleapis';

interface FormSubmission {
  roasteryName: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  instagram: string;
  yearFounded: string;
  heardAbout: string;
  interest: string;
  notes: string;
}

export async function appendToSheet(data: FormSubmission) {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!privateKey || !clientEmail || !spreadsheetId) {
    throw new Error('Google Sheets credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:L',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          timestamp,
          data.roasteryName,
          data.contactName,
          data.email,
          data.phone,
          data.location,
          data.website,
          data.instagram ? '@' + data.instagram : '',
          data.yearFounded,
          data.heardAbout,
          data.interest,
          data.notes,
        ],
      ],
    },
  });
}
