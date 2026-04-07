// api/_auth.js — Shared session validation helper
// Used by all API endpoints to validate Bearer tokens against Redis sessions.
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

/**
 * Validates the session token from the Authorization header.
 * Returns session object if valid, null if invalid/missing.
 * Checks SECURITY_BYPASS env var first — if 'true', skips validation.
 * Also allows Vercel cron requests (CRON_SECRET header match).
 */
export async function validateSession(req) {
  // SECURITY_BYPASS — emergency bypass for debugging
  if (process.env.SECURITY_BYPASS === 'true') {
    return { bypassed: true, store_id: 1, companyId: 'dc-appliance', employee_name: 'BYPASS' };
  }

  // Allow Vercel cron jobs (they send x-vercel-cron-signature or match CRON_SECRET)
  if (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) {
    return { cron: true, store_id: 1, companyId: 'dc-appliance', employee_name: 'CRON' };
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) return null;

  try {
    const raw = await redis.get('session:' + token);
    if (!raw) return null;
    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // Check expiry
    if (session.expires_at && Date.now() > session.expires_at) {
      await redis.del('session:' + token);
      return null;
    }

    return session;
  } catch (e) {
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
