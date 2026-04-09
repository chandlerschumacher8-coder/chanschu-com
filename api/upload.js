// api/upload.js — File upload to Vercel Blob (permanent public URLs)
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { filename, contentType, data, companyId, jobId } = req.body;
    if (!filename || !data || !companyId || !jobId) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const buffer = Buffer.from(data, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'BLOB_READ_WRITE_TOKEN not configured' });
    }
    const { put } = await import('@vercel/blob');
    const blobName = `service/${companyId}/${jobId}/${Date.now()}-${safeName}`;
    const blob = await put(blobName, buffer, {
      access: 'public', contentType: contentType || 'application/octet-stream', addRandomSuffix: false,
    });
    console.log('[upload] Saved to Vercel Blob:', blobName, blob.url);
    return res.status(200).json({ ok: true, url: blob.url, filename });
  } catch (err) {
    console.error('[upload] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
