// api/get-results.js
// Returns all stored win/loss/push results from Redis

// Public endpoint — sports.html has no login
import { setCorsHeaders } from './_auth.js';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 'no-store');
 
  try {
    const raw = await redis.get('pick-results');
 
    let results = {};
    if (raw) {
      results = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
 
    // Calculate totals
    let wins = 0, losses = 0, pushes = 0;
    Object.values(results).forEach(function(v) {
      if (v === 'win') wins++;
      else if (v === 'loss') losses++;
      else if (v === 'push') pushes++;
    });
 
    return res.status(200).json({
      ok: true,
      results,
      totals: { wins, losses, pushes }
    });
 
  } catch (err) {
    console.error('get-results error:', err);
    return res.status(500).json({ ok: false, error: err.message, results: {} });
  }
}
