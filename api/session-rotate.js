// api/session-rotate.js — Rotates a session token (generates new, invalidates old)
// Sessions stored in Supabase (not Redis).
import crypto from 'crypto';
import { validateSession, unauthorized, setCorsHeaders } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const session = await validateSession(req);
    if (!session) return unauthorized(res, 'Invalid or expired session');
    if (!useSupabase()) return res.status(500).json({ ok: false, error: 'Supabase required' });

    const sb = getSupabase();
    const oldToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

    // Generate new token — expires at midnight
    const newToken = crypto.randomUUID();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    const expires_at = midnight.toISOString();

    // Insert new session
    await sb.from('sessions').insert({
      store_id: session.store_id || 1,
      token: newToken,
      employee_id: session.employee_id,
      employee_name: session.employee_name,
      company_id: session.companyId || 'dc-appliance',
      auth_type: session.authType || 'employee',
      expires_at,
    });

    // Delete old session
    if (oldToken) await sb.from('sessions').delete().eq('token', oldToken);

    return res.status(200).json({ ok: true, token: newToken, expires_at: midnight.getTime() });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
