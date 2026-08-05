import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  scopes: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

export function googleDriveClient() {
  return google.drive({ version: "v3", auth });
}

export function googleSheetsClient() {
  return google.sheets({ version: "v4", auth });
}
