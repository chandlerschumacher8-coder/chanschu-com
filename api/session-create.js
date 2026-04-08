// api/session-create.js — Creates a session token on PIN or contractor password login
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { setCorsHeaders } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

const redis = Redis.fromEnv();

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
      const techsRaw = await redis.get('service:techs');
      const techs = techsRaw ? (typeof techsRaw === 'string' ? JSON.parse(techsRaw) : techsRaw) : [];
      const names = techs.filter(t => t.active !== false).map(t => t.tech || t.name);
      return res.status(200).json({ ok: true, contractors: names });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { pin, password, techName, companyId, authType } = req.body;
    let employee = null;
    const store_id = 1; // DC Appliance is store #1

    if (authType === 'contractor') {
      if (!password) return res.status(400).json({ ok: false, error: 'Missing password' });

      if (useSupabase()) {
        const { data } = await getSupabase()
          .from('service_techs')
          .select('*')
          .eq('store_id', store_id)
          .eq('active', true)
          .eq('password', password);
        // If techName provided, match by name; otherwise take first password match
        const tech = techName
          ? (data || []).find(t => (t.tech || t.name) === techName)
          : (data || [])[0];
        if (!tech) return res.status(401).json({ ok: false, error: 'Incorrect password — please try again' });
        employee = {
          id: tech.tech_id || String(tech.id), name: tech.tech || tech.name,
          tech: tech.tech || tech.name, posRole: 'Contractor Tech',
          role: 'tech', authType: 'contractor'
        };
      } else {
        const techsRaw = await redis.get('service:techs');
        const techs = techsRaw ? (typeof techsRaw === 'string' ? JSON.parse(techsRaw) : techsRaw) : [];
        const tech = techName
          ? techs.find(t => t.active !== false && (t.tech || t.name) === techName && t.password === password)
          : techs.find(t => t.active !== false && t.password === password);
        if (!tech) return res.status(401).json({ ok: false, error: 'Incorrect password — please try again' });
        employee = {
          id: tech.id || tech.name, name: tech.tech || tech.name,
          tech: tech.tech || tech.name, posRole: 'Contractor Tech',
          role: 'tech', authType: 'contractor'
        };
      }
    } else if (authType === 'timeclock') {
      if (!pin || pin.length !== 4) return res.status(400).json({ ok: false, error: 'Invalid PIN' });
      const cid = companyId || 'dc-appliance';

      if (useSupabase()) {
        const { data } = await getSupabase()
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
      } else {
        const usersRaw = await redis.get('users:' + cid);
        const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
        const matches = users.filter(u => u.active !== false && u.pin === pin);
        if (matches.length !== 1) return res.status(401).json({ ok: false, error: 'Incorrect PIN' });
        const u = matches[0];
        employee = {
          id: u.id || u.name, name: u.name,
          posRole: u.posRole || u.role || 'Sales', role: u.role,
          tech: u.tech, permissions: u.permissions, authType: 'timeclock'
        };
      }

      // Short-lived session for time clock (5 minutes)
      const token = crypto.randomUUID();
      const expires_at = Date.now() + 5 * 60 * 1000;
      const session = {
        token, employee_id: employee.id, employee_name: employee.name,
        store_id, companyId: cid, created_at: new Date().toISOString(),
        expires_at, authType: 'timeclock'
      };
      // Sessions stay in Redis for now (fast TTL-based expiry)
      await redis.set('session:' + token, JSON.stringify(session), { ex: 300 });
      return res.status(200).json({ ok: true, token, employee, store_id, expires_at });
    } else {
      // Standard PIN login
      if (!pin || pin.length !== 4) return res.status(400).json({ ok: false, error: 'Invalid PIN' });
      const cid = companyId || 'dc-appliance';

      if (useSupabase()) {
        const { data } = await getSupabase()
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
      } else {
        const usersRaw = await redis.get('users:' + cid);
        const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
        const matches = users.filter(u => u.active !== false && u.pin === pin);
        if (matches.length !== 1) return res.status(401).json({ ok: false, error: 'Incorrect PIN' });
        const u = matches[0];
        employee = {
          id: u.id || u.name, name: u.name,
          posRole: u.posRole || u.role || 'Sales', role: u.role,
          tech: u.tech, permissions: u.permissions, authType: 'employee'
        };
      }
    }

    // Generate token
    const token = crypto.randomUUID();
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const expires_at = midnight.getTime();
    const ttlSeconds = Math.max(60, Math.ceil((expires_at - Date.now()) / 1000));

    const session = {
      token,
      employee_id: employee.id || employee.name,
      employee_name: employee.name,
      store_id,
      companyId: companyId || 'dc-appliance',
      created_at: now.toISOString(),
      expires_at,
      authType: employee.authType
    };

    // Sessions stay in Redis for TTL-based expiry
    await redis.set('session:' + token, JSON.stringify(session), { ex: ttlSeconds });

    return res.status(200).json({ ok: true, token, employee, store_id, expires_at });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
