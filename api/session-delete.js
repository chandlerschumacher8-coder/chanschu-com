// api/session-delete.js — Deletes a session token (logout)
// Sessions stored in Supabase (not Redis).
import { setCorsHeaders } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token && useSupabase()) {
      await getSupabase().from('sessions').delete().eq('token', token);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
