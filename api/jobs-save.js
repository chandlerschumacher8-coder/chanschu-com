// api/jobs-save.js — Save jobs for a company
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
    const { companyId, jobs, nextId } = req.body;
    if (!Array.isArray(jobs)) return res.status(400).json({ ok: false, error: 'Invalid data' });

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();
      await sb.from('service_jobs').delete().eq('store_id', store_id);
      if (jobs.length) {
        for (let i = 0; i < jobs.length; i += 100) {
          const batch = jobs.slice(i, i + 100).map(j => ({
            store_id, job_id: j.id || 'JOB-0000', name: j.name || 'Unknown',
            phone: j.phone || null, email: j.email || null, address: j.address || null,
            city: j.city || null, appliance: j.appliance || null, brand: j.brand || null,
            model: j.model || null, serial: j.serial || null, warranty: j.warranty || null,
            invoice: j.invoice || null, claim: j.claim || null, delivery: j.delivery || null,
            issue: j.issue || null, date: j.date || null, time: j.time || null,
            tech: j.tech || null, priority: j.priority || 'Normal', notes: j.notes || null,
            status: j.status || 'Open', part_on_order: j.partOnOrder || false,
            part_number: j.partNumber || null, customer_contacted: j.customerContacted || false,
            activity_log: j.activityLog || [], files: j.files || [],
            created_at: j.createdAt || new Date().toISOString(),
            completed_at: j.completedAt || null,
          }));
          const { error } = await sb.from('service_jobs').insert(batch);
          if (error) throw new Error(error.message);
        }
      }
      await sb.from('counters').upsert({ store_id, key: 'next_job_id', value: nextId || jobs.length + 1 }, { onConflict: 'store_id,key' });
      return res.status(200).json({ ok: true, count: jobs.length });
    }

    // Redis fallback
    const cid = companyId || 'dc-appliance';
    await getRedis().set('jobs:' + cid, JSON.stringify({ jobs, nextId: nextId || jobs.length + 1 }));
    return res.status(200).json({ ok: true, count: jobs.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
