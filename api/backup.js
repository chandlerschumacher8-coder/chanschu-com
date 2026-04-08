// api/backup.js — Full database backup to Vercel Blob
// Supports: manual trigger (POST with auth) and cron trigger (GET with no auth)
import { validateSession, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

const ALERT_EMAIL = 'dodgecityappliance@gmail.com';
const MAX_BACKUPS = 30;

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  // Determine if this is a cron call (GET) or manual (POST with auth)
  const isCron = req.method === 'GET';
  let store_id = 1;

  if (!isCron) {
    const session = await validateSession(req);
    if (!session) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    store_id = session.store_id || 1;
  }

  if (!useSupabase()) {
    return res.status(400).json({ ok: false, error: 'Backup requires Supabase' });
  }

  const sb = getSupabase();
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const blobName = `backups/store-${store_id}/backup-${ts}.json`;

  try {
    // ── Export all critical tables ──
    const tables = [
      { name: 'deliveries', query: sb.from('deliveries').select('*').eq('store_id', store_id) },
      { name: 'delivery_notes', query: sb.from('delivery_notes').select('*').eq('store_id', store_id) },
      { name: 'customers', query: sb.from('customers').select('*').eq('store_id', store_id).eq('deleted', false) },
      { name: 'orders', query: sb.from('orders').select('*').eq('store_id', store_id).eq('deleted', false) },
      { name: 'order_items', query: sb.from('order_items').select('*').eq('store_id', store_id).eq('deleted', false) },
      { name: 'products', query: sb.from('products').select('*').eq('store_id', store_id).eq('deleted', false) },
      { name: 'serial_pool', query: sb.from('serial_pool').select('*').eq('store_id', store_id).eq('deleted', false) },
      { name: 'service_jobs', query: sb.from('service_jobs').select('*').eq('store_id', store_id) },
      { name: 'employees', query: sb.from('employees').select('*').eq('store_id', store_id) },
      { name: 'time_clock', query: sb.from('time_clock').select('*').eq('store_id', store_id) },
      { name: 'counters', query: sb.from('counters').select('*').eq('store_id', store_id) },
      { name: 'store_config', query: sb.from('store_config').select('*').eq('store_id', store_id) },
      { name: 'brands', query: sb.from('brands').select('*').eq('store_id', store_id) },
      { name: 'vendors', query: sb.from('vendors').select('*').eq('store_id', store_id) },
      { name: 'categories', query: sb.from('categories').select('*').eq('store_id', store_id) },
      { name: 'departments', query: sb.from('departments').select('*').eq('store_id', store_id) },
    ];

    const backup = {
      version: 1,
      store_id,
      created_at: now.toISOString(),
      tables: {},
      counts: {},
    };

    for (const t of tables) {
      try {
        const { data, error } = await t.query;
        if (error) {
          console.error(`[Backup] Table ${t.name} error:`, error.message);
          backup.tables[t.name] = [];
          backup.counts[t.name] = 0;
        } else {
          backup.tables[t.name] = data || [];
          backup.counts[t.name] = (data || []).length;
        }
      } catch (e) {
        console.error(`[Backup] Table ${t.name} exception:`, e.message);
        backup.tables[t.name] = [];
        backup.counts[t.name] = 0;
      }
    }

    const totalRecords = Object.values(backup.counts).reduce((a, b) => a + b, 0);
    console.log(`[Backup] Exported ${totalRecords} records across ${tables.length} tables`);

    // ── Store in Vercel Blob ──
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    }
    const { put, list, del } = await import('@vercel/blob');
    const jsonStr = JSON.stringify(backup);
    const blob = await put(blobName, jsonStr, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    console.log(`[Backup] Saved to blob: ${blob.url} (${(jsonStr.length / 1024).toFixed(1)} KB)`);

    // ── Save backup metadata to store_config ──
    const metaKey = 'backup-history';
    const { data: existing } = await sb.from('store_config').select('data').eq('store_id', store_id).eq('key', metaKey).single();
    const history = (existing && Array.isArray(existing.data)) ? existing.data : [];
    history.unshift({
      url: blob.url,
      name: blobName,
      created_at: now.toISOString(),
      size_kb: Math.round(jsonStr.length / 1024),
      counts: backup.counts,
      total_records: totalRecords,
      trigger: isCron ? 'cron' : 'manual',
    });

    // Keep only last MAX_BACKUPS
    const trimmed = history.slice(0, MAX_BACKUPS);

    // Delete old blobs beyond MAX_BACKUPS
    const toDelete = history.slice(MAX_BACKUPS);
    for (const old of toDelete) {
      try { await del(old.url); } catch (e) { /* ignore */ }
    }

    await sb.from('store_config').upsert(
      { store_id, key: metaKey, data: trimmed },
      { onConflict: 'store_id,key' }
    );

    return res.status(200).json({
      ok: true,
      url: blob.url,
      name: blobName,
      created_at: now.toISOString(),
      size_kb: Math.round(jsonStr.length / 1024),
      counts: backup.counts,
      total_records: totalRecords,
    });

  } catch (err) {
    console.error('[Backup] FAILED:', err.message);

    // ── Send failure alert email via EmailJS REST API ──
    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_gx9g5vj',
          template_id: 'template_0eo26t5',
          user_id: '8rsxIaKLiiRqq5Yo0',
          template_params: {
            to_email: ALERT_EMAIL,
            customer_name: 'System Alert',
            invoice_number: 'BACKUP-FAIL',
            invoice_html: `<h2 style="color:#dc2626;">Backup Failed</h2>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <p><strong>Store:</strong> ${store_id}</p>
              <p><strong>Error:</strong> ${err.message}</p>
              <p>Please check the Vercel logs and retry the backup manually.</p>`,
          },
        }),
      });
      console.log('[Backup] Alert email sent to', ALERT_EMAIL);
    } catch (emailErr) {
      console.error('[Backup] Alert email failed:', emailErr.message);
    }

    return res.status(500).json({ ok: false, error: err.message });
  }
}
