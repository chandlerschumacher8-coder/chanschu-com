// api/admin-verify.js
// Verifies admin password against Chandler's (Owner/Admin) PIN from employee records in Redis

import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ ok: false, error: 'No password provided' });

    // Look up Chandler's PIN from the employee records
    const raw = await redis.get('users:dc-appliance');
    const users = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    const admin = users.find(u => u.posRole === 'Owner/Admin' && u.active !== false);

    if (!admin || !admin.pin) {
      return res.status(500).json({ ok: false, error: 'No Owner/Admin PIN configured' });
    }

    if (password === admin.pin) {
      return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
