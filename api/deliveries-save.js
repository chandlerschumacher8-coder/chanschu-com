// api/deliveries-save.js
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { deliveries, nextId, notes, nextNoteId } = req.body;
    if (!Array.isArray(deliveries)) return res.status(400).json({ ok: false, error: 'Invalid data' });
    await redis.set('dc-deliveries', JSON.stringify({
      deliveries,
      nextId: nextId || deliveries.length + 1,
      notes: notes || [],
      nextNoteId: nextNoteId || 1
    }));
    return res.status(200).json({ ok: true, count: deliveries.length });
  } catch(err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
