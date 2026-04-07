// api/delivery-photo-upload.js
// Upload delivery photos to Supabase Storage (delivery-photos bucket)
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const BUCKET = 'delivery-photos';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function ensureBucket(supabase) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
  }
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { filename, contentType, data, deliveryId } = req.body;
    if (!filename || !data || !deliveryId) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const supabase = getSupabase();
    await ensureBucket(supabase);

    const storeId = session.store_id || 1;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${storeId}/${deliveryId}/${Date.now()}-${safeName}`;

    const buffer = Buffer.from(data, 'base64');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ ok: false, error: uploadError.message });
    }

    // Generate a signed URL (valid for 7 days)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return res.status(500).json({ ok: false, error: signedError.message });
    }

    return res.status(200).json({
      ok: true,
      url: signedData.signedUrl,
      path: path,
      filename: safeName,
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
