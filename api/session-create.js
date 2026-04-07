// api/session-create.js — Creates a session token on PIN or contractor password login
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { setCorsHeaders } from './_auth.js';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET mode: return contractor tech names for login dropdown (no auth required, no passwords exposed)
  if (req.method === 'GET') {
    try {
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
      // Contractor password login
      if (!password || !techName) return res.status(400).json({ ok: false, error: 'Missing password or tech name' });
      const techsRaw = await redis.get('service:techs');
      const techs = techsRaw ? (typeof techsRaw === 'string' ? JSON.parse(techsRaw) : techsRaw) : [];
      const tech = techs.find(t => t.active !== false && (t.tech || t.name) === techName && t.password === password);
      if (!tech) return res.status(401).json({ ok: false, error: 'Incorrect password' });
      employee = {
        id: tech.id || tech.name,
        name: tech.tech || tech.name,
        tech: tech.tech || tech.name,
        posRole: 'Contractor Tech',
        role: 'tech',
        authType: 'contractor'
      };
    } else if (authType === 'timeclock') {
      // Time clock PIN validation — returns employee info but creates a short-lived session
      if (!pin || pin.length !== 4) return res.status(400).json({ ok: false, error: 'Invalid PIN' });
      const cid = companyId || 'dc-appliance';
      const usersRaw = await redis.get('users:' + cid);
      const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
      const matches = users.filter(u => u.active !== false && u.pin === pin);
      if (matches.length !== 1) return res.status(401).json({ ok: false, error: 'Incorrect PIN' });
      const u = matches[0];
      employee = {
        id: u.id || u.name,
        name: u.name,
        posRole: u.posRole || u.role || 'Sales',
        role: u.role,
        tech: u.tech,
        permissions: u.permissions,
        authType: 'timeclock'
      };
      // Short-lived session for time clock (5 minutes)
      const token = crypto.randomUUID();
      const expires_at = Date.now() + 5 * 60 * 1000;
      const session = {
        token, employee_id: employee.id, employee_name: employee.name,
        store_id, companyId: cid, created_at: new Date().toISOString(),
        expires_at, authType: 'timeclock'
      };
      await redis.set('session:' + token, JSON.stringify(session), { ex: 300 });
      return res.status(200).json({ ok: true, token, employee, store_id, expires_at });
    } else {
      // Standard PIN login
      if (!pin || pin.length !== 4) return res.status(400).json({ ok: false, error: 'Invalid PIN' });
      const cid = companyId || 'dc-appliance';
      const usersRaw = await redis.get('users:' + cid);
      const users = usersRaw ? (typeof usersRaw === 'string' ? JSON.parse(usersRaw) : usersRaw) : [];
      const matches = users.filter(u => u.active !== false && u.pin === pin);
      if (matches.length !== 1) return res.status(401).json({ ok: false, error: 'Incorrect PIN' });
      const u = matches[0];
      employee = {
        id: u.id || u.name,
        name: u.name,
        posRole: u.posRole || u.role || 'Sales',
        role: u.role,
        tech: u.tech,
        permissions: u.permissions,
        authType: 'employee'
      };
    }

    // Generate token
    const token = crypto.randomUUID();

    // Expires at midnight
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

    await redis.set('session:' + token, JSON.stringify(session), { ex: ttlSeconds });

    return res.status(200).json({ ok: true, token, employee, store_id, expires_at });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
