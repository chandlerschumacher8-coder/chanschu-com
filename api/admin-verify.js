// api/admin-verify.js
// Verifies admin password against ADMIN_PASSWORD environment variable

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { password } = req.body;
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw) return res.status(500).json({ ok: false, error: 'ADMIN_PASSWORD not configured' });
    if (password === adminPw) {
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false, error: 'Incorrect password' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
