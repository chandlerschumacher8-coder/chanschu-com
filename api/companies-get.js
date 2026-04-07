// api/companies-get.js — Get all companies (superadmin only)
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const raw = await redis.get('companies');
    const companies = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    return res.status(200).json({ ok: true, companies });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, companies: [] });
  }
}
