// api/dc-jobs-save.js
// Saves the full jobs array to Redis
 
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
 
  try {
    const { jobs, nextId } = req.body;
    if (!Array.isArray(jobs)) return res.status(400).json({ ok: false, error: 'Invalid jobs data' });
    await redis.set('dc-service-jobs', JSON.stringify({ jobs, nextId: nextId || jobs.length + 1 }));
    return res.status(200).json({ ok: true, count: jobs.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
