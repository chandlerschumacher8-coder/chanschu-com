// api/employees-save.js — Unified employee/tech SAVE endpoint
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
import { getSupabase, useSupabase } from './_supabase.js';
let _redis;
function getRedis() { if (!_redis) _redis = Redis.fromEnv(); return _redis; }

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { companyId, users, requesterPassword } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ ok: false, error: 'Invalid data' });
    }

    // Auth check
    const isSuperAdmin = requesterPassword === process.env.SUPER_ADMIN_PASSWORD;
    const isPosMaster = requesterPassword === 'DCA123';
    if (!isSuperAdmin && !isPosMaster) {
      if (useSupabase()) {
        const store_id = session.store_id || 1;
        const { data: existing } = await getSupabase()
          .from('employees')
          .select('password, role')
          .eq('store_id', store_id)
          .eq('password', requesterPassword)
          .eq('role', 'admin')
          .limit(1);
        if (!existing || !existing.length) return res.status(403).json({ ok: false, error: 'Unauthorized' });
      } else {
        const cid = companyId || 'dc-appliance';
        const existingRaw = await getRedis().get('users:' + cid);
        const existing = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : [];
        const requester = existing.find(u => u.password === requesterPassword && u.role === 'admin');
        if (!requester) return res.status(403).json({ ok: false, error: 'Unauthorized' });
      }
    }

    const hasAdmin = users.some(u => u.role === 'admin');
    if (!hasAdmin) return res.status(400).json({ ok: false, error: 'Must have at least one admin' });

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();

      // Delete existing employees for this store, then re-insert
      const { error: delError } = await sb.from('employees').delete().eq('store_id', store_id);
      if (delError) throw new Error(delError.message);

      const rows = users.map(u => ({
        store_id,
        employee_id: u.id || null,
        name: u.name || 'Unknown',
        pos_role: u.posRole || 'Sales',
        role: u.role || 'employee',
        pin: u.pin || null,
        password: u.password || null,
        phone: u.phone || null,
        email: u.email || null,
        tech: u.tech || null,
        commission_rate: u.commissionRate || null,
        wage: u.wage || null,
        active: u.active !== false,
        permissions: u.permissions || [],
      }));

      const { error: insError } = await sb.from('employees').insert(rows);
      if (insError) throw new Error(insError.message);
      return res.status(200).json({ ok: true });
    }

    // Redis fallback
    const cid = companyId || 'dc-appliance';
    await getRedis().set('users:' + cid, JSON.stringify(users));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
