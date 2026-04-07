// api/delivery-photo-upload.js
// Upload delivery photos to Vercel Blob storage
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

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
    const { put } = await import('@vercel/blob');
    const buffer = Buffer.from(data, 'base64');
    const safeName = `delivery-photos/${deliveryId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const blob = await put(safeName, buffer, {
      contentType: contentType || 'image/jpeg',
    });
    return res.status(200).json({ ok: true, url: blob.url, filename });
  } catch (err) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
