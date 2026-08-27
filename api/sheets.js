// Proxies GET (list reviews) and POST (append review) to the Google Apps Script
// web app that sits in front of the Google Sheet. Keeping this as a proxy
// (rather than calling Apps Script directly from the browser) avoids CORS
// headaches with Apps Script's redirect-based web app URLs.

export default async function handler(req, res) {
  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ error: 'APPS_SCRIPT_URL is not configured on the server.' });
  }

  try {
    if (req.method === 'GET') {
      const employeeId = req.query.employeeId;
      const url = employeeId
        ? `${APPS_SCRIPT_URL}?employeeId=${encodeURIComponent(employeeId)}`
        : APPS_SCRIPT_URL;
      const upstream = await fetch(url);
      const data = await upstream.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const upstream = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await upstream.json();
      return res.status(200).json(data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('sheets proxy error', err);
    return res.status(502).json({ error: 'Failed to reach the Sheets backend.' });
  }
}
