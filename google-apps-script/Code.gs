/**
 * Crystal People — Google Sheets backend.
 *
 * SETUP:
 * 1. Create a Google Sheet. Rename the first tab to "Reviews".
 * 2. Add header row (row 1) with exactly these columns:
 *    Timestamp | EmployeeId | EmployeeName | Manager | Month | OutputQuality | Attendance | Teamwork | AvgScore | Comment
 * 3. Extensions > Apps Script, delete any starter code, paste this file in.
 * 4. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL — that's your APPS_SCRIPT_URL env var on Vercel.
 * 6. Share the Sheet itself with "Anyone with the link — Viewer" for submission.
 *
 * IMPORTANT: SpreadsheetApp.getActiveSpreadsheet() returns null when this
 * script runs as a web app (i.e. every doGet/doPost call), because there is
 * no "active" spreadsheet in that execution context — that context only
 * exists when the script runs from the Sheet's own UI (menus, triggers you
 * click). So we open the spreadsheet explicitly by its ID instead.
 *
 * To get the ID: open your Sheet, look at the URL:
 * https://docs.google.com/spreadsheets/d/THIS_LONG_ID_HERE/edit
 * Paste THIS_LONG_ID_HERE below.
 */

const SPREADSHEET_ID = '16jXshdTlxbl1Sn1mnUB5XWYPhnRqvpFr2DoCZpn48ts';
const SHEET_NAME = 'Reviews';

function getSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

function doGet(e) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift(); // remove header row

  let reviews = rows
    .filter((row) => row[1]) // skip blank rows (EmployeeId empty)
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[toCamel(h)] = row[i];
      });
      return obj;
    });

  const employeeId = e.parameter && e.parameter.employeeId;
  if (employeeId) {
    reviews = reviews.filter((r) => String(r.employeeId) === String(employeeId));
  }

  return ContentService.createTextOutput(JSON.stringify({ reviews }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getSheet();
  const body = JSON.parse(e.postData.contents);

  const row = [
    new Date().toISOString(),
    body.employeeId || '',
    body.employeeName || '',
    body.manager || '',
    body.month || '',
    body.outputQuality || '',
    body.attendance || '',
    body.teamwork || '',
    body.avgScore || '',
    body.comment || '',
  ];

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function toCamel(header) {
  // "OutputQuality" -> "outputQuality", "EmployeeId" -> "employeeId"
  return header.charAt(0).toLowerCase() + header.slice(1);
}
