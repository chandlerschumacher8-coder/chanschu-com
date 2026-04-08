// api/jobs-get.js — Get jobs for a company
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
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
      const sb = getSupabase();
      const { data, error } = await sb.from('service_jobs').select('*').eq('store_id', store_id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const { data: counters } = await sb.from('counters').select('value').eq('store_id', store_id).eq('key', 'next_job_id').single();
      const jobs = (data || []).map(j => ({
        id: j.job_id, name: j.name, phone: j.phone, email: j.email,
        address: j.address, city: j.city, appliance: j.appliance,
        brand: j.brand, model: j.model, serial: j.serial,
        warranty: j.warranty, invoice: j.invoice, claim: j.claim,
        delivery: j.delivery, issue: j.issue, date: j.date, time: j.time,
        tech: j.tech, priority: j.priority, notes: j.notes, status: j.status,
        partOnOrder: j.part_on_order, partNumber: j.part_number,
        customerContacted: j.customer_contacted,
        activityLog: j.activity_log || [], files: j.files || [],
        createdAt: j.created_at, completedAt: j.completed_at,
        _dbId: j.id,
      }));
      return res.status(200).json({ ok: true, jobs, nextId: counters?.value || jobs.length + 1 });
    }

    // Redis fallback
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ ok: false, error: 'Missing companyId' });
    const raw = await getRedis().get('jobs:' + companyId);
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : { jobs: [], nextId: 1 };
    return res.status(200).json({ ok: true, jobs: data.jobs || [], nextId: data.nextId || 1 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, jobs: [], nextId: 1 });
  }
}
