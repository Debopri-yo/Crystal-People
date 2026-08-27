// Server-side Gemini API calls. The API key never reaches the browser.
// Two modes:
//  - "summary": plain-English 3-month trend summary for the employee dashboard
//  - "flag": checks whether a manager's written comment is consistent with
//            the numeric scores they just entered, before they submit

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini({ systemInstruction, userText, maxTokens = 400 }) {
  const resp = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        // gemini-2.5-flash has "thinking" on by default, and thinking tokens
        // count against maxOutputTokens — at low token budgets this can
        // silently consume the whole response, leaving nothing for the
        // actual answer. We don't need hidden reasoning for these two
        // simple tasks, so we turn it off.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Gemini API error (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return text;
}

function buildSummaryPrompt(employeeName, reviews) {
  const lines = reviews
    .slice()
    .reverse() // oldest first, so the trend reads chronologically
    .map(
      (r) =>
        `${r.month}: Output ${r.outputQuality}/5, Attendance ${r.attendance}/5, Teamwork ${r.teamwork}/5, Avg ${r.avgScore}/5. Manager comment: "${r.comment || 'none'}"`
    )
    .join('\n');

  return `Here are ${employeeName}'s last ${reviews.length} monthly performance reviews, oldest first:\n\n${lines}\n\nWrite a short (3-4 sentence) plain-English summary of the trend for ${employeeName} to read themselves. Note whether they're improving, steady, or declining, call out which specific dimension is driving that, and end with one constructive, encouraging note. Do not just restate the numbers — interpret them. Write directly to the employee ("you"), in a warm but honest tone.`;
}

function buildFlagPrompt(scores, comment) {
  return `A manager scored an employee this month as: Output Quality ${scores.outputQuality}/5, Attendance ${scores.attendance}/5, Teamwork ${scores.teamwork}/5.

Their written comment was: "${comment}"

Decide if the tone and content of the comment is reasonably consistent with these scores (e.g. a comment that is entirely negative paired with all 5s, or entirely glowing paired with 1s/2s, would be inconsistent). Minor mismatches are fine — only flag clear contradictions.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"consistent": true or false, "note": "one short sentence explaining your judgment, addressed to the manager"}`;
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
    const { type } = req.body;

    if (type === 'summary') {
      const { employeeName, reviews } = req.body;
      if (!reviews || reviews.length === 0) {
        return res.status(200).json({ summary: 'Not enough review history yet.' });
      }
      const text = await callGemini({
        systemInstruction: 'You are a concise, honest HR analyst who explains performance trends in plain, human language. No jargon, no bullet lists, just a short warm paragraph.',
        userText: buildSummaryPrompt(employeeName, reviews),
        maxTokens: 500,
      });
      return res.status(200).json({ summary: text.trim() });
    }

    if (type === 'flag') {
      const { scores, comment } = req.body;
      const text = await callGemini({
        systemInstruction: 'You output strict JSON only. No markdown fences, no preamble, no explanation outside the JSON object.',
        userText: buildFlagPrompt(scores, comment),
        maxTokens: 200,
      });
      let parsed;
      try {
        const cleaned = text.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { consistent: true, note: 'Could not parse AI response, proceeding without a flag.' };
      }
      return res.status(200).json(parsed);
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err) {
    console.error('gemini proxy error', err);
    return res.status(502).json({ error: 'Failed to reach Gemini API.', debug: String(err && err.message) });
  }
}
