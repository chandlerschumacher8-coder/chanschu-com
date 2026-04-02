// api/import-customers.js — Parse XLS/XLSX/CSV and preview or import customers
import { Redis } from '@upstash/redis';
import * as XLSX from 'xlsx';
const redis = Redis.fromEnv();

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { fileBase64, action, customers } = req.body;

    // ACTION: import — save pre-mapped customers to Redis
    if (action === 'import' && Array.isArray(customers)) {
      await redis.set('pos:customers', JSON.stringify(customers));
      return res.status(200).json({ ok: true, count: customers.length });
    }

    // ACTION: preview — parse file and return headers + rows
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
