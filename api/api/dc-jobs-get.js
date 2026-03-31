// api/dc-jobs-get.js
// Returns all jobs from Redis
 
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
 
  try {
    const raw = await redis.get('dc-service-jobs');
    if (!raw) return res.status(200).json({ ok: true, jobs: [], nextId: 1 });
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json({ ok: true, jobs: data.jobs || [], nextId: data.nextId || 1 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, jobs: [], nextId: 1 });
  }
}
