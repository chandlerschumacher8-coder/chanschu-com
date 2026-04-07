// api/jobs-get.js — Get jobs for a company
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ ok: false, error: 'Missing companyId' });
    const raw = await redis.get('jobs:' + companyId);
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : { jobs: [], nextId: 1 };
    return res.status(200).json({ ok: true, jobs: data.jobs || [], nextId: data.nextId || 1 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, jobs: [], nextId: 1 });
  }
}
