// api/session-rotate.js — Rotates a session token (generates new, invalidates old)
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { validateSession, unauthorized, setCorsHeaders } from './_auth.js';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const session = await validateSession(req);
    if (!session) return unauthorized(res, 'Invalid or expired session');

    const oldToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

    // Generate new token
    const newToken = crypto.randomUUID();
    const now = Date.now();

    // Keep same expiry (midnight) or refresh to next midnight
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    const expires_at = midnight.getTime();
    const ttlSeconds = Math.max(60, Math.ceil((expires_at - now) / 1000));

    const newSession = {
      ...session,
      token: newToken,
      created_at: new Date().toISOString(),
      expires_at
    };

    // Store new session, delete old
    await redis.set('session:' + newToken, JSON.stringify(newSession), { ex: ttlSeconds });
    if (oldToken) await redis.del('session:' + oldToken);

    return res.status(200).json({ ok: true, token: newToken, expires_at });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
