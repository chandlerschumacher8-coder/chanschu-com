// api/session-create.js — Creates a session token on PIN or contractor password login
// Sessions stored in Supabase (not Redis) for reliability.
import crypto from 'crypto';
import { setCorsHeaders } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET mode: return contractor tech names for login dropdown
  if (req.method === 'GET') {
    try {
      if (useSupabase()) {
        const { data } = await getSupabase()
          .from('service_techs')
          .select('name, tech')
          .eq('store_id', 1)
          .eq('active', true);
        const names = (data || []).map(t => t.tech || t.name);
        return res.status(200).json({ ok: true, contractors: names });
      }
      return res.status(200).json({ ok: true, contractors: [] });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    if (!useSupabase()) return res.status(500).json({ ok: false, error: 'Supabase required for sessions' });
    const sb = getSupabase();

    const { pin, password, techName, companyId, authType } = req.body;
    let employee = null;
    const store_id = 1; // DC Appliance is store #1

    if (authType === 'contractor') {
      if (!password) return res.status(400).json({ ok: false, error: 'Missing password' });
      const { data } = await sb
        .from('service_techs')
        .select('*')
        .eq('store_id', store_id)
        .eq('active', true)
        .eq('password', password);
      const tech = techName
        ? (data || []).find(t => (t.tech || t.name) === techName)
        : (data || [])[0];
      if (!tech) return res.status(401).json({ ok: false, error: 'Incorrect password — please try again' });
      employee = {
        id: tech.tech_id || String(tech.id), name: tech.tech || tech.name,
        tech: tech.tech || tech.name, posRole: 'Contractor Tech',
        role: 'tech', authType: 'contractor'
      };
    } else if (authType === 'timeclock') {
      if (!pin || pin.length !== 4) return res.status(400).json({ ok: false, error: 'Invalid PIN' });
      const { data } = await sb
        .from('employees')
        .select('*')
        .eq('store_id', store_id)
        .eq('active', true)
        .eq('pin', pin);
      if (!data || data.length !== 1) return res.status(401).json({ ok: false, error: 'Incorrect PIN' });
      const u = data[0];
      employee = {
        id: u.employee_id || String(u.id), name: u.name,
        posRole: u.pos_role || 'Sales', role: u.role,
        tech: u.tech, permissions: u.permissions, authType: 'timeclock'
      };

      // Short-lived session for time clock (5 minutes)
      const token = crypto.randomUUID();
      const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await sb.from('sessions').insert({
        store_id, token, employee_id: employee.id, employee_name: employee.name,
        company_id: companyId || 'dc-appliance', auth_type: 'timeclock', expires_at,
      });
      return res.status(200).json({ ok: true, token, employee, store_id, expires_at: new Date(expires_at).getTime() });
    } else {
      // Standard PIN login
      if (!pin || pin.length !== 4) return res.status(400).json({ ok: false, error: 'Invalid PIN' });
      const { data } = await sb
        .from('employees')
        .select('*')
        .eq('store_id', store_id)
        .eq('active', true)
        .eq('pin', pin);
      if (!data || data.length !== 1) return res.status(401).json({ ok: false, error: 'Incorrect PIN' });
      const u = data[0];
      employee = {
        id: u.employee_id || String(u.id), name: u.name,
        posRole: u.pos_role || 'Sales', role: u.role,
        tech: u.tech, permissions: u.permissions, authType: 'employee'
      };
    }

    // Generate token — expires at midnight
    const token = crypto.randomUUID();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    const expires_at = midnight.toISOString();

    // Store session in Supabase
    await sb.from('sessions').insert({
      store_id, token,
      employee_id: employee.id || employee.name,
      employee_name: employee.name,
      company_id: companyId || 'dc-appliance',
      auth_type: employee.authType || 'employee',
      expires_at,
    });

    // Clean up expired sessions (background, non-blocking)
    sb.from('sessions').delete().lt('expires_at', new Date().toISOString()).then(() => {});

    return res.status(200).json({ ok: true, token, employee, store_id, expires_at: midnight.getTime() });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
