// api/admin-verify.js
// Verifies admin password against Owner/Admin PIN from employee records
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ ok: false, error: 'No password provided' });

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const { data } = await getSupabase()
        .from('employees')
        .select('pin')
        .eq('store_id', store_id)
        .eq('pos_role', 'Owner/Admin')
        .eq('active', true)
        .limit(1);
      if (!data || !data.length || !data[0].pin) {
        return res.status(500).json({ ok: false, error: 'No Owner/Admin PIN configured' });
      }
      if (password === data[0].pin) return res.status(200).json({ ok: true });
      return res.status(401).json({ ok: false, error: 'Incorrect password' });
    }

    // Redis fallback
    const raw = await redis.get('users:dc-appliance');
    const users = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    const admin = users.find(u => u.posRole === 'Owner/Admin' && u.active !== false);
    if (!admin || !admin.pin) {
      return res.status(500).json({ ok: false, error: 'No Owner/Admin PIN configured' });
    }
    if (password === admin.pin) return res.status(200).json({ ok: true });
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
