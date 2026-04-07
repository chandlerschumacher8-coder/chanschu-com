// api/companies-delete.js — Delete a company and all its data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { companyId, superKey } = req.body;
    if (superKey !== process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }

    if (useSupabase()) {
      const sb = getSupabase();
      // Look up the store_id for this company
      const { data: comp } = await sb.from('companies').select('store_id').eq('id', companyId).single();
      if (comp) {
        const sid = comp.store_id;
        // Delete related data
        await sb.from('order_items').delete().eq('store_id', sid);
        await sb.from('orders').delete().eq('store_id', sid);
        await sb.from('serial_pool').delete().eq('store_id', sid);
        await sb.from('products').delete().eq('store_id', sid);
        await sb.from('service_jobs').delete().eq('store_id', sid);
        await sb.from('deliveries').delete().eq('store_id', sid);
        await sb.from('delivery_notes').delete().eq('store_id', sid);
        await sb.from('employees').delete().eq('store_id', sid);
        await sb.from('service_techs').delete().eq('store_id', sid);
        await sb.from('customers').delete().eq('store_id', sid);
        await sb.from('time_clock').delete().eq('store_id', sid);
        await sb.from('counters').delete().eq('store_id', sid);
      }
      await sb.from('companies').delete().eq('id', companyId);
      return res.status(200).json({ ok: true });
    }

    // Redis fallback
    const raw = await redis.get('companies');
    let companies = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    companies = companies.filter(c => c.id !== companyId);
    await redis.set('companies', JSON.stringify(companies));
    await redis.del('users:' + companyId);
    await redis.del('jobs:' + companyId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
