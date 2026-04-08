// api/log-error.js — Log frontend errors to Supabase error_logs table
import { handlePreflight, setCorsHeaders } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  // No auth required — errors can happen before login
  try {
    const { store_id, employee_name, page, error_message, stack_trace, user_agent } = req.body;
    if (!useSupabase()) return res.status(200).json({ ok: true, logged: false });

    const sb = getSupabase();
    const { error } = await sb.from('error_logs').insert({
      store_id: store_id || 1,
      employee_name: employee_name || null,
      page: page || null,
      error_message: (error_message || 'Unknown error').slice(0, 2000),
      stack_trace: (stack_trace || '').slice(0, 5000),
      user_agent: (user_agent || '').slice(0, 500),
    });
    if (error) console.error('[Error Log] Insert error:', error.message);

    // Auto-clean errors older than 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('error_logs').delete().lt('created_at', cutoff);

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: true, error: err.message });
  }
}
