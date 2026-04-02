// api/admin-get.js — Generic key-value GET for POS admin data
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ ok: false, error: 'Missing key parameter' });
    const raw = await redis.get('pos:' + key);
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, data: null });
  }
}
