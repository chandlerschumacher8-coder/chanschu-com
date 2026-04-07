// api/dc-upload.js — DC Appliance file upload (Supabase Storage or Vercel Blob fallback)
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const BUCKET = 'service-files';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { filename, contentType, data, jobId } = req.body;
    if (!filename || !data || !jobId) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const buffer = Buffer.from(data, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (useSupabase()) {
      const sb = getSupabase();
      const { data: bucketData } = await sb.storage.getBucket(BUCKET);
      if (!bucketData) {
        await sb.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 10485760 });
      }
      const path = `dc-service/${jobId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buffer, {
        contentType: contentType || 'application/octet-stream', upsert: false,
      });
      if (upErr) throw new Error(upErr.message);
      const { data: signed } = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
      return res.status(200).json({ ok: true, url: signed.signedUrl, path, filename: safeName });
    }

    // Vercel Blob fallback
    const { put } = await import('@vercel/blob');
    const blobName = `dc-service/${jobId}/${Date.now()}-${safeName}`;
    const blob = await put(blobName, buffer, {
      contentType: contentType || 'application/octet-stream',
    });
    return res.status(200).json({ ok: true, url: blob.url, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
