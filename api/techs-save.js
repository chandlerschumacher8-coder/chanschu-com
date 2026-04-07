// api/techs-save.js — SAVE service techs to service:techs key
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

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
