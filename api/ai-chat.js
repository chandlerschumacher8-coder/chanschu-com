// api/ai-chat.js
// Secure proxy for Anthropic API calls — keeps key server-side

import { validateSession, unauthorized, handlePreflight } from './_auth.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
 
  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ ok: false, error: 'API key not configured' });
 
  try {
    const { messages, system, max_tokens } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 600,
        system: system || '',
        messages,
      }),
    });
 
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ ok: false, error: err });
    }
 
    const data = await response.json();
    return res.status(200).json({ ok: true, content: data.content });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
