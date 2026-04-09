// api/employees-get.js — Unified employee/tech GET endpoint
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
import { getSupabase, useSupabase } from './_supabase.js';
let _redis;
function getRedis() { if (!_redis) _redis = Redis.fromEnv(); return _redis; }

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const { data, error } = await getSupabase()
        .from('employees')
        .select('*')
        .eq('store_id', store_id)
        .order('name');
      if (error) throw new Error(error.message);
      // Map to frontend format
      const users = (data || []).map(e => ({
        id: e.employee_id || String(e.id),
        name: e.name,
        posRole: e.pos_role,
        role: e.role,
        pin: e.pin,
        password: e.password,
        phone: e.phone,
        email: e.email,
        tech: e.tech,
        commissionRate: e.commission_rate,
        wage: e.wage,
        active: e.active,
        permissions: e.permissions || [],
        _dbId: e.id,
      }));
      console.log(`[employees-get] Returning ${users.length} employees for store_id=${store_id}`);
      return res.status(200).json({ ok: true, users });
    }

    // Redis fallback
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ ok: false, error: 'Missing companyId' });
    const raw = await getRedis().get('users:' + companyId);
    const users = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, users: [] });
  }
}
