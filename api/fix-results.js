// api/fix-results.js
// One-time manual override for pick results
// Usage: POST { password, wins, losses, pushes } to set totals directly
// OR: POST { password, add: { wins: 2, losses: 0 } } to add to existing totals

import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    // GET — just show current totals
    if (req.method === 'GET') {
      const raw = await redis.get('pick-results');
      const results = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
      const wins   = Object.values(results).filter(v => v === 'win').length;
      const losses = Object.values(results).filter(v => v === 'loss').length;
      const pushes = Object.values(results).filter(v => v === 'push').length;
      return res.status(200).json({ ok: true, wins, losses, pushes, total: Object.keys(results).length, raw: results });
    }
 
    const { password, wins, losses, pushes } = req.body;
    if (password !== process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }
 
    // Build a synthetic results object with the right counts
    const results = {};
    const ts = Date.now();
    for (let i = 0; i < (wins || 0); i++)   results['manual-win-'  + ts + '-' + i] = 'win';
    for (let i = 0; i < (losses || 0); i++) results['manual-loss-' + ts + '-' + i] = 'loss';
    for (let i = 0; i < (pushes || 0); i++) results['manual-push-' + ts + '-' + i] = 'push';
 
    // Merge with existing results
    const existingRaw = await redis.get('pick-results');
    const existing = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : {};
    const merged = Object.assign({}, existing, results);
    await redis.set('pick-results', JSON.stringify(merged));
 
    const totalWins   = Object.values(merged).filter(v => v === 'win').length;
    const totalLosses = Object.values(merged).filter(v => v === 'loss').length;
    const totalPushes = Object.values(merged).filter(v => v === 'push').length;
 
    return res.status(200).json({ ok: true, added: { wins, losses, pushes }, totals: { wins: totalWins, losses: totalLosses, pushes: totalPushes } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
