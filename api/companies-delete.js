// api/companies-delete.js — Delete a company and all its data
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
 
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
