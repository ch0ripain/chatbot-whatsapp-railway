// const { google } = require('googleapis');
import { google } from "googleapis";
// Initializes the Google APIs client library and sets up the authentication using service account credentials.
const auth = new google.auth.GoogleAuth({
    keyFile: './google.json',  // Path to your service account key file.
    scopes: ['https://www.googleapis.com/auth/spreadsheets']  // Scope for Google Sheets API.
});

export async function appendToSheet(values) {

    const spreadsheetId = process.env.SPREADSHEET_ID
    const sheets = google.sheets({ version: 'v4', auth }); // Create a Sheets API client instance
    const range = 'Rutatina!A1'; // The range in the sheet to start appending
    const valueInputOption = 'USER_ENTERED'; // How input data should be interpreted
    const resource = { values: [values] };

    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            resource,
        });
        return res; // Returns the response from the Sheets API
    } catch (error) {
        console.error('error', error); // Logs errors
    }
}

export async function readSheet(range) {
    const spreadsheetId = process.env.SPREADSHEET_ID
    const sheets = google.sheets({
        version: 'v4', auth
    });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId, range
        });
        const rows = response.data.values; // Extracts the rows from the response.
        return rows; // Returns the rows.
    } catch (error) {
        console.error('error', error); // Logs errors.
    }
}