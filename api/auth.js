// api/auth.js — Login, returns user session data
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ ok: false, error: 'Missing password' });
 
    // Super admin check
    if (password === process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(200).json({
        ok: true,
        user: { name: 'Chandler', role: 'superadmin', companyId: null, companyName: 'All Companies' }
      });
    }
 
    // Check all companies for matching user
    const companiesRaw = await redis.get('companies');
    const companies = companiesRaw ? (typeof companiesRaw === 'string' ? JSON.parse(companiesRaw) : companiesRaw) : [];
 
    for (const company of companies) {
      const usersRaw = await redis.get('users:' + company.id);
      const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
      const user = users.find(u => u.password === password);
      if (user) {
        return res.status(200).json({
          ok: true,
          user: {
            name: user.name,
            role: user.role,         // 'admin' or 'tech'
            tech: user.tech || null,
            companyId: company.id,
            companyName: company.name,
          }
        });
      }
    }
 
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
