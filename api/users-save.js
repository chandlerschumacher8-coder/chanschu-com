// api/users-save.js — Save users for a company
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  try {
    const { companyId, users, requesterPassword } = req.body;
    if (!companyId || !Array.isArray(users)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    // Verify requester is admin of this company OR superadmin
    const isSuperAdmin = requesterPassword === process.env.SUPER_ADMIN_PASSWORD;
    if (!isSuperAdmin) {
      const existingRaw = await redis.get('users:' + companyId);
      const existing = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : [];
      const requester = existing.find(u => u.password === requesterPassword && u.role === 'admin');
      if (!requester) return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }
    const hasAdmin = users.some(u => u.role === 'admin');
    if (!hasAdmin) return res.status(400).json({ ok: false, error: 'Must have at least one admin' });
    await redis.set('users:' + companyId, JSON.stringify(users));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
