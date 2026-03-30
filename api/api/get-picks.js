// api/get-picks.js
// Serves stored daily picks from Redis to the frontend
// Also triggers a fresh generation if picks are missing or stale
 
import { Redis } from '@upstash/redis';
 
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
 
  try {
    const raw = await redis.get('daily-picks');
 
    if (!raw) {
      // No picks stored yet — trigger generation
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://www.chanschu.com';
 
      // Fire and forget — don't await so we respond quickly
      fetch(`${baseUrl}/api/daily-picks`).catch(() => {});
 
      return res.status(200).json({
        ok: true,
        pending: true,
        message: 'Picks are being generated — check back in 30 seconds.',
        picks: [],
        date: new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }),
      });
    }
 
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
 
    return res.status(200).json({ ok: true, ...data });
 
  } catch (err) {
    console.error('get-picks error:', err);
    return res.status(500).json({ ok: false, error: err.message, picks: [] });
  }
}
