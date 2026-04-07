// api/companies-delete.js — Delete a company and all its data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
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
