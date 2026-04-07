// api/techs-get.js — GET service techs
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const { data, error } = await getSupabase()
        .from('service_techs')
        .select('*')
        .eq('store_id', store_id)
        .order('name');
      if (error) throw new Error(error.message);
      const techs = (data || []).map(t => ({
        id: t.tech_id || String(t.id),
        name: t.name,
        tech: t.tech,
        password: t.password,
        phone: t.phone,
        email: t.email,
        active: t.active,
        _dbId: t.id,
      }));
      return res.status(200).json({ ok: true, techs });
    }

    // Redis fallback
    const raw = await redis.get('service:techs');
    const techs = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    return res.status(200).json({ ok: true, techs });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, techs: [] });
  }
}
