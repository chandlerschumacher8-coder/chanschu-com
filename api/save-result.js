// api/save-result.js
// Saves a win/loss/push result for a pick to Redis

import { Redis } from '@upstash/redis';
import { handlePreflight, setCorsHeaders } from './_auth.js';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  setCorsHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
 
  try {
    const { pickId, result } = req.body;
    if (!pickId) return res.status(400).json({ ok: false, error: 'Missing pickId' });
 
    // Get existing results
    const raw = await redis.get('pick-results');
    let results = {};
    if (raw) {
      results = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
 
    // Set or delete result
    if (result === null || result === undefined) {
      delete results[pickId];
    } else {
      results[pickId] = result;
    }
 
    // Save back — no expiry so results are permanent
    await redis.set('pick-results', JSON.stringify(results));
 
    return res.status(200).json({ ok: true, results });
 
  } catch (err) {
    console.error('save-result error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
 
