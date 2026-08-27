// Server-side Gemini API calls. The API key never reaches the browser.
// Two modes:
//  - "summary": plain-English 3-month trend summary for the employee dashboard
//  - "flag": checks whether a manager's written comment is consistent with
//            the numeric scores they just entered, before they submit

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini({ systemInstruction, userText, maxTokens = 160, json = false }) {
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 },
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const resp = await fetch(`${ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const detail = data?.error?.message || `HTTP ${resp.status}`;
    throw new Error(`Gemini API error (${resp.status}): ${detail}`);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || '')
    .join('')
    .trim() || '';

  if (!text) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || 'empty response';
    throw new Error(`Gemini returned no text (${reason}).`);
  }

  return text;
}

function buildSummaryPrompt(employeeName, reviews) {
  const lines = reviews
    .slice(0, 3)
    .reverse()
    .map(
      (r) =>
        `${r.month}: Output ${r.outputQuality}/5, Attendance ${r.attendance}/5, Teamwork ${r.teamwork}/5. Comment: "${String(r.comment || 'none').slice(0, 400)}"`
    )
    .join('\n');

  return `Employee: ${employeeName}

Last ${reviews.length} monthly reviews, oldest first:
${lines}

Write 3-4 short sentences directly to the employee using "you". Say whether performance is improving, steady, or declining, identify the dimension driving the trend, and end with one constructive, encouraging note. Interpret the scores rather than merely listing them. Use only the information provided; do not invent facts.`;
}

function buildFlagPrompt(scores, comment) {
  return `Scores: Output Quality ${scores.outputQuality}/5, Attendance ${scores.attendance}/5, Teamwork ${scores.teamwork}/5.
Manager comment: "${String(comment).slice(0, 800)}"

Decide whether the comment is reasonably consistent with the scores. Only flag clear contradictions; minor mismatches are fine.
Return JSON with exactly two fields: {"consistent": true or false, "note": "one short sentence for the manager"}.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { type } = req.body || {};

    if (type === 'summary') {
      const { employeeName, reviews } = req.body;

      if (!Array.isArray(reviews) || reviews.length === 0) {
        return res.status(200).json({ summary: 'Not enough review history yet.' });
      }

      const text = await callGemini({
        systemInstruction: 'You are a concise, honest HR analyst. Use plain human language, no jargon, no bullet lists.',
        userText: buildSummaryPrompt(employeeName, reviews),
        maxTokens: 160,
      });

      return res.status(200).json({ summary: text });
    }

    if (type === 'flag') {
      const { scores, comment } = req.body;

      if (!scores || !comment?.trim()) {
        return res.status(400).json({ error: 'Scores and comment are required.' });
      }

      const text = await callGemini({
        systemInstruction: 'Return only valid JSON. Do not use markdown or extra text.',
        userText: buildFlagPrompt(scores, comment),
        maxTokens: 100,
        json: true,
      });

      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        return res.status(200).json({
          consistent: true,
          note: 'AI returned an unreadable result, so the review can proceed without a flag.',
        });
      }
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err) {
    console.error('gemini proxy error:', err);
    return res.status(502).json({ error: 'Gemini is temporarily unavailable. Please try again.' });
  }
}
