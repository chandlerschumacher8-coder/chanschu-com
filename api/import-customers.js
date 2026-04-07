// api/import-customers.js — Parse XLS/XLSX/CSV and preview or import customers
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
import * as XLSX from 'xlsx';
const redis = Redis.fromEnv();

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { fileBase64, action, customers } = req.body;

    // ACTION: import — parse, merge 2-row pairs, save to Redis
    if (action === 'import') {
      if (!fileBase64) return res.status(400).json({ ok: false, error: 'No file data' });

      const buf = Buffer.from(fileBase64, 'base64');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const merged = [];
      for (let i = 0; i < rows.length; i += 2) {
        const r1 = rows[i];
        const r2 = rows[i + 1] || {};
        const name = String(r1['Customer Name'] || '').trim();
        if (!name) continue;

        // Parse "City, ST   Zip" from row 2's Address column
        const csz = String(r2['Address'] || '').trim();
        let city = '', state = '', zip = '';
        const m = csz.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
        if (m) { city = m[1].trim(); state = m[2]; zip = m[3]; }
        else { city = csz; }

        merged.push({
          name,
          address: String(r1['Address'] || '').trim(),
          phone: String(r1['Phone'] || '').trim(),
          customerNum: r1['Customer #'] ? String(r1['Customer #']) : '',
          city, state, zip,
          email: '', notes: ''
        });
      }

      await redis.set('pos:customers', JSON.stringify(merged));
      return res.status(200).json({ ok: true, count: merged.length, preview: merged.slice(0, 10) });
    }

    // ACTION: preview — parse file and return headers + first rows
    if (!fileBase64) return res.status(400).json({ ok: false, error: 'No file data' });

    const buf = Buffer.from(fileBase64, 'base64');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(200).json({ ok: true, headers: [], rows: [], total: 0 });

    const headers = Object.keys(rows[0]);
    return res.status(200).json({
      ok: true,
      headers,
      preview: rows.slice(0, 10),
      total: rows.length
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
