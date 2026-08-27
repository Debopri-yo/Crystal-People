// All calls go through our own /api serverless functions, which in turn
// talk to the Google Apps Script web app (sheet) and the Anthropic API.
// This keeps the Claude API key server-side and gives us one place to
// handle errors / CORS.

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

export function getReviews(employeeId) {
  const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
  return request(`/api/sheets${qs}`);
}

export function submitReview(review) {
  return request('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
}

export function getTrendSummary(employeeName, reviews) {
  return request('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'summary', employeeName, reviews }),
  });
}

export function getConsistencyCheck(scores, comment) {
  return request('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'flag', scores, comment }),
  });
}
