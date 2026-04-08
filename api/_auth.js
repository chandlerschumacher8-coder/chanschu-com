// api/_auth.js — Shared session validation helper
// Sessions are stored in Supabase (not Redis) for reliability.
import { getSupabase, useSupabase } from './_supabase.js';

/**
 * Validates the session token from the Authorization header.
 * Returns session object if valid, null if invalid/missing.
 */
export async function validateSession(req) {
  // SECURITY_BYPASS — emergency bypass for debugging
  if (process.env.SECURITY_BYPASS === 'true') {
    return { bypassed: true, store_id: 1, companyId: 'dc-appliance', employee_name: 'BYPASS' };
  }

  // Allow Vercel cron jobs
  if (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) {
    return { cron: true, store_id: 1, companyId: 'dc-appliance', employee_name: 'CRON' };
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    if (!useSupabase()) return null;
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) return null;

    // Check expiry
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      // Clean up expired session
      await sb.from('sessions').delete().eq('token', token);
      return null;
    }

    // Return session in the format all endpoints expect
    return {
      store_id: data.store_id || 1,
      employee_id: data.employee_id,
      employee_name: data.employee_name,
      companyId: data.company_id || 'dc-appliance',
      authType: data.auth_type,
      token: data.token,
      created_at: data.created_at,
      expires_at: new Date(data.expires_at).getTime(),
    };
  } catch (e) {
    console.error('[Auth] Session validation error:', e.message);
    return null;
  }
}

/**
 * Returns a 401 Unauthorized response.
 */
export function unauthorized(res, message) {
  return res.status(401).json({ ok: false, error: message || 'Unauthorized — valid session token required' });
}

/**
 * Sets standard CORS headers for API responses.
 */
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://chanschu.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handles OPTIONS preflight and returns true if handled.
 */
export function handlePreflight(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
