// api/jobs-save.js — Save jobs for a company
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const { companyId, jobs, nextId } = req.body;
    if (!companyId || !Array.isArray(jobs)) return res.status(400).json({ ok: false, error: 'Invalid data' });
    await redis.set('jobs:' + companyId, JSON.stringify({ jobs, nextId: nextId || jobs.length + 1 }));
    return res.status(200).json({ ok: true, count: jobs.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
