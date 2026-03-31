// api/dc-jobs-save.js
// Saves the full jobs array to Redis
 
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
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
