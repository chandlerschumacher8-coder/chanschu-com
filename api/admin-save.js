// api/admin-save.js — Generic key-value POST for POS admin data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const { key, data } = req.body;
    if (!key) return res.status(400).json({ ok: false, error: 'Missing key' });
    if (data === undefined) return res.status(400).json({ ok: false, error: 'Missing data' });
    await redis.set('pos:' + key, JSON.stringify(data));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
