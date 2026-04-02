// api/techs-save.js — SAVE service techs to service:techs key
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { techs, requesterPassword } = req.body;
    if (!Array.isArray(techs)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    // Auth: POS master password or super admin
    const isSuperAdmin = requesterPassword === process.env.SUPER_ADMIN_PASSWORD;
    const isPosMaster = requesterPassword === 'DCA123';
    if (!isSuperAdmin && !isPosMaster) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }
    await redis.set('service:techs', JSON.stringify(techs));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
