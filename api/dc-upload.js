// api/dc-upload.js
// Handles file uploads — stores files in Vercel Blob storage
// Returns a URL to the stored file

import { validateSession, unauthorized, handlePreflight } from './_auth.js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

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
 
    // Dynamically import Vercel Blob
    const { put } = await import('@vercel/blob');
 
    // Convert base64 to buffer
    const buffer = Buffer.from(data, 'base64');
    const safeName = `dc-service/${jobId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
 
    const blob = await put(safeName, buffer, {
      contentType: contentType || 'application/octet-stream',
    });
 
    return res.status(200).json({ ok: true, url: blob.url, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
