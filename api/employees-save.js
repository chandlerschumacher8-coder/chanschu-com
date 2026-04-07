// api/employees-save.js — Unified employee/tech SAVE endpoint
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { companyId, users, requesterPassword } = req.body;
    if (!companyId || !Array.isArray(users)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    // Verify requester is admin of this company, superadmin, or POS master
    const isSuperAdmin = requesterPassword === process.env.SUPER_ADMIN_PASSWORD;
    const isPosMaster = requesterPassword === 'DCA123';
    if (!isSuperAdmin && !isPosMaster) {
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
