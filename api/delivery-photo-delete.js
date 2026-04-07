// api/delivery-photo-delete.js
// Delete a delivery photo from Supabase Storage
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'delivery-photos';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ ok: false, error: 'Missing path' });
    }

    const supabase = getSupabase();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Photo delete error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
