// api/companies-save.js — Create or update a company
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { company, superKey } = req.body;
    if (superKey !== process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }

    if (useSupabase()) {
      const sb = getSupabase();
      const row = {
        id: company.id,
        store_id: company.store_id || 1,
        name: company.name || company.id,
        address: company.address || null,
        phone: company.phone || null,
        email: company.email || null,
      };
      const { error } = await sb.from('companies').upsert(row, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true });
    }

    // Redis fallback
    const raw = await redis.get('companies');
    let companies = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    const idx = companies.findIndex(c => c.id === company.id);
    if (idx >= 0) { companies[idx] = company; } else { companies.push(company); }
    await redis.set('companies', JSON.stringify(companies));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
