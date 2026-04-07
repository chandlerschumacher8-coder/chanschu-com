// api/techs-get.js — GET service techs from service:techs key
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const raw = await redis.get('service:techs');
    const techs = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    return res.status(200).json({ ok: true, techs });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, techs: [] });
  }
}
