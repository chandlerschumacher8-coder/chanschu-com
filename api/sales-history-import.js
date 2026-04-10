// api/sales-history-import.js
// Upserts cleaned SmartTouch sales history rows into sales_history_items.
// Conflict key: (store_id, smarttouch_line_id). NEVER bulk-deletes.

import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export const config = { maxDuration: 60 };

function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[$,]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}
function toInt(v) {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
}
function toBool(v) {
  if (v === null || v === undefined || v === '') return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === 't' || s === '1' || s === 'y' || s === 'yes';
}
function toDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Accept YYYY-MM-DD, M/D/YYYY, etc. Supabase will coerce valid ISO dates.
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function str(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function normalizeRow(r, storeId) {
  const lineId = str(r.smarttouch_line_id);
  if (!lineId) return null;
  return {
    store_id: storeId,
    smarttouch_line_id: lineId,
    invoice_number: str(r.invoice_number),
    numeric_invoice_number: toInt(r.numeric_invoice_number),
    date: toDate(r.date),
    ship_date: toDate(r.ship_date),
    delivery_date: toDate(r.delivery_date),
    customer_smarttouch_id: str(r.customer_smarttouch_id),
    customer_name: str(r.customer_name),
    model_number: str(r.model_number),
    sku: str(r.sku),
    description: str(r.description),
    brand: str(r.brand),
    category: str(r.category),
    department: str(r.department),
    qty: toNum(r.qty),
    unit_price: toNum(r.unit_price),
    ext_price: toNum(r.ext_price),
    product_cost: toNum(r.product_cost),
    invoice_total: toNum(r.invoice_total),
    tax: toNum(r.tax),
    tax_rate: toNum(r.tax_rate),
    discount: toNum(r.discount),
    serial_number: str(r.serial_number),
    sales_rep: str(r.sales_rep),
    sales_rep2: str(r.sales_rep2),
    commission_due: toNum(r.commission_due),
    commission_method: str(r.commission_method),
    status: str(r.status),
    returned: toBool(r.returned),
    seq: toInt(r.seq),
    phone: str(r.phone),
    zip: str(r.zip),
    po_number: str(r.po_number),
    delivery_instructions: str(r.delivery_instructions),
    terms: str(r.terms),
    updated_at: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  if (!useSupabase()) {
    return res.status(500).json({ ok: false, error: 'Supabase not enabled' });
  }

  try {
    const body = req.body || {};
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) return res.status(400).json({ ok: false, error: 'No rows provided' });

    // Always force store_id = 1 per task spec; ignore any store_id in the payload.
    const storeId = 1;

    const normalized = [];
    let skipped = 0;
    for (const r of rows) {
      const n = normalizeRow(r, storeId);
      if (n) normalized.push(n);
      else skipped++;
    }

    if (!normalized.length) {
      return res.status(400).json({ ok: false, error: 'No valid rows (missing smarttouch_line_id)' });
    }

    const sb = getSupabase();
    let upserted = 0;
    const errors = [];

    // Batch upserts. Conflict on (store_id, smarttouch_line_id) — unique constraint.
    // Never deletes anything.
    for (let i = 0; i < normalized.length; i += 500) {
      const batch = normalized.slice(i, i + 500);
      const { error, count } = await sb
        .from('sales_history_items')
        .upsert(batch, {
          onConflict: 'store_id,smarttouch_line_id',
          count: 'exact',
          ignoreDuplicates: false,
        });
      if (error) {
        errors.push({ batchStart: i, message: error.message });
      } else {
        upserted += (typeof count === 'number' ? count : batch.length);
      }
    }

    return res.status(200).json({
      ok: errors.length === 0,
      upserted,
      skipped,
      total: rows.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
