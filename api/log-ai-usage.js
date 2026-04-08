// api/log-ai-usage.js — Log AI usage to Supabase ai_usage table
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { feature, model, input_tokens, output_tokens, total_tokens, estimated_cost, duration_ms, success, error_message, employee_name } = req.body;
    if (!useSupabase()) return res.status(200).json({ ok: true, logged: false });

    const store_id = session.store_id || 1;
    const sb = getSupabase();
    const { error } = await sb.from('ai_usage').insert({
      store_id,
      employee_name: employee_name || session.employee?.name || 'Unknown',
      feature: feature || 'unknown',
      model: model || 'claude-sonnet-4-6',
      input_tokens: input_tokens || 0,
      output_tokens: output_tokens || 0,
      total_tokens: total_tokens || 0,
      estimated_cost: estimated_cost || 0,
      duration_ms: duration_ms || 0,
      success: success !== false,
      error_message: success === false ? (error_message || null) : null,
    });
    if (error) console.error('[AI Usage] Insert error:', error.message);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[AI Usage] Error:', err.message);
    return res.status(200).json({ ok: true, error: err.message });
  }
}
