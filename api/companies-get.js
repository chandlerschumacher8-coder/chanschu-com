// api/companies-get.js — Get all companies (superadmin only)
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const raw = await redis.get('companies');
    const companies = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    return res.status(200).json({ ok: true, companies });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, companies: [] });
  }
}
