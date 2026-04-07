// api/auth.js — Login, returns user session data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

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
      // Check POS employees (users:companyId) — admins can access service portal
      const usersRaw = await redis.get('users:' + company.id);
      const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
      const user = users.find(u => u.password === password && u.active !== false);
      if (user) {
        return res.status(200).json({
          ok: true,
          user: {
            name: user.name,
            role: user.role || 'admin',
            tech: user.tech || null,
            companyId: company.id,
            companyName: company.name,
          }
        });
      }
    }

    // Check service techs (service:techs) — independent contractors
    const techsRaw = await redis.get('service:techs');
    const techs = techsRaw ? (typeof techsRaw === 'string' ? JSON.parse(techsRaw) : techsRaw) : [];
    const tech = techs.find(t => t.password === password && t.active !== false);
    if (tech) {
      return res.status(200).json({
        ok: true,
        user: {
          name: tech.name,
          role: 'tech',
          tech: tech.tech || tech.name,
          companyId: 'dc-appliance',
          companyName: 'DC Appliance',
        }
      });
    }

    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
