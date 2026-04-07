// api/get-results.js
// Returns all stored win/loss/push results from Redis

import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
 
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
