// api/auth.js — Login, returns user session data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
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

    if (useSupabase()) {
      const sb = getSupabase();

      // Check employees
      const { data: empMatch } = await sb
        .from('employees')
        .select('name, role, tech, store_id')
        .eq('password', password)
        .eq('active', true)
        .limit(1);
      if (empMatch && empMatch.length) {
        const u = empMatch[0];
        // Look up company
        const { data: comp } = await sb.from('companies').select('id, name').eq('store_id', u.store_id).limit(1).single();
        return res.status(200).json({
          ok: true,
          user: {
            name: u.name, role: u.role || 'admin', tech: u.tech || null,
            companyId: comp?.id || 'dc-appliance', companyName: comp?.name || 'DC Appliance',
          }
        });
      }

      // Check service techs
      const { data: techMatch } = await sb
        .from('service_techs')
        .select('name, tech')
        .eq('password', password)
        .eq('active', true)
        .limit(1);
      if (techMatch && techMatch.length) {
        const t = techMatch[0];
        return res.status(200).json({
          ok: true,
          user: {
            name: t.name, role: 'tech', tech: t.tech || t.name,
            companyId: 'dc-appliance', companyName: 'DC Appliance',
          }
        });
      }

      return res.status(401).json({ ok: false, error: 'Incorrect password' });
    }

    // Redis fallback
    const companiesRaw = await redis.get('companies');
    const companies = companiesRaw ? (typeof companiesRaw === 'string' ? JSON.parse(companiesRaw) : companiesRaw) : [];

    for (const company of companies) {
      const usersRaw = await redis.get('users:' + company.id);
      const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
      const user = users.find(u => u.password === password && u.active !== false);
      if (user) {
        return res.status(200).json({
          ok: true,
          user: {
            name: user.name, role: user.role || 'admin', tech: user.tech || null,
            companyId: company.id, companyName: company.name,
          }
        });
      }
    }

    const techsRaw = await redis.get('service:techs');
    const techs = techsRaw ? (typeof techsRaw === 'string' ? JSON.parse(techsRaw) : techsRaw) : [];
    const tech = techs.find(t => t.password === password && t.active !== false);
    if (tech) {
      return res.status(200).json({
        ok: true,
        user: {
          name: tech.name, role: 'tech', tech: tech.tech || tech.name,
          companyId: 'dc-appliance', companyName: 'DC Appliance',
        }
      });
    }

    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
