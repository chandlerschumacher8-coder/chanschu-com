// api/employees-get.js — Unified employee/tech GET endpoint
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ ok: false, error: 'Missing companyId' });
    const raw = await redis.get('users:' + companyId);
    const users = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, users: [] });
  }
}
