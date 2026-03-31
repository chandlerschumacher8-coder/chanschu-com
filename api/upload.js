// api/upload.js — File upload to Vercel Blob (public store)
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  try {
    const { filename, contentType, data, companyId, jobId } = req.body;
    if (!filename || !data || !companyId || !jobId) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ ok: false, error: 'BLOB_READ_WRITE_TOKEN not configured in Vercel.' });
    }
 
    const { put } = await import('@vercel/blob');
    const buffer = Buffer.from(data, 'base64');
    const safeName = `service/${companyId}/${jobId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
 
    const blob = await put(safeName, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: false,
    });
 
    return res.status(200).json({ ok: true, url: blob.url, filename });
  } catch (err) {
    console.error('Upload error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
