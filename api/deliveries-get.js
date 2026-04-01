// api/deliveries-get.js
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const raw = await redis.get('dc-deliveries');
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : { deliveries: [], nextId: 1, notes: [], nextNoteId: 1 };
    return res.status(200).json({
      ok: true,
      deliveries: data.deliveries || [],
      nextId: data.nextId || 1,
      notes: data.notes || [],
      nextNoteId: data.nextNoteId || 1
    });
  } catch(err) {
    return res.status(500).json({ ok: false, error: err.message, deliveries: [], nextId: 1, notes: [], nextNoteId: 1 });
  }
}
