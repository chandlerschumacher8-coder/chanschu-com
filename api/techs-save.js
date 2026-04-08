// api/techs-save.js — SAVE service techs
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
let _redis;
function getRedis() { if (!_redis) _redis = Redis.fromEnv(); return _redis; }

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { techs, requesterPassword } = req.body;
    if (!Array.isArray(techs)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }
    const isSuperAdmin = requesterPassword === process.env.SUPER_ADMIN_PASSWORD;
    const isPosMaster = requesterPassword === 'DCA123';
    if (!isSuperAdmin && !isPosMaster) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();
      await sb.from('service_techs').delete().eq('store_id', store_id);
      const rows = techs.map(t => ({
        store_id,
        tech_id: t.id || null,
        name: t.name || 'Unknown',
        tech: t.tech || null,
        password: t.password || null,
        phone: t.phone || null,
        email: t.email || null,
        active: t.active !== false,
      }));
      const { error } = await sb.from('service_techs').insert(rows);
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true });
    }

    // Redis fallback
    await getRedis().set('service:techs', JSON.stringify(techs));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
