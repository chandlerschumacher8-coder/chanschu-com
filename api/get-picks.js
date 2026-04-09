// api/get-picks.js
// Serves stored daily picks from Redis to the frontend
// Also triggers a fresh generation if picks are missing or stale

// Public endpoint — sports.html has no login
import { setCorsHeaders } from './_auth.js';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
 
  try {
    const raw = await redis.get('daily-picks');
 
    if (raw === null || raw === undefined) {
      return res.status(200).json({
        ok: true,
        pending: false,
        picks: [],
        date: new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }),
        message: 'No picks yet — click Generate New Picks.',
      });
    }
 
    // Upstash may return already-parsed object or a string
    let data;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch(e) { data = { picks: [], error: 'Parse error' }; }
    } else {
      data = raw;
    }
 
    return res.status(200).json({ ok: true, ...data });
 
  } catch (err) {
    console.error('get-picks error:', err);
    return res.status(500).json({ ok: false, error: err.message, picks: [] });
  }
}
 
