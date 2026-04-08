// api/backup-restore.js — Restore database from a backup blob
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  if (!useSupabase()) {
    return res.status(400).json({ ok: false, error: 'Restore requires Supabase' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'Missing backup url' });

  const store_id = session.store_id || 1;
  const sb = getSupabase();

  try {
    // Fetch backup JSON from blob
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch backup: HTTP ' + resp.status);
    const backup = await resp.json();

    if (!backup.tables) throw new Error('Invalid backup format — missing tables');

    const results = {};

    // Helper: restore a table by deleting active records and re-inserting
    async function restoreTable(tableName, rows, options = {}) {
      if (!rows || !rows.length) { results[tableName] = 0; return; }

      // Delete current active records
      if (options.hasDeleted) {
        await sb.from(tableName).delete().eq('store_id', store_id).eq('deleted', false);
      } else {
        await sb.from(tableName).delete().eq('store_id', store_id);
      }

      // Re-insert in batches
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500).map(r => {
          // Remove the auto-generated id so Supabase assigns new ones
          const { id, ...rest } = r;
          return rest;
        });
        const { error } = await sb.from(tableName).insert(batch);
        if (error) console.error(`[Restore] ${tableName} batch error:`, error.message);
      }
      results[tableName] = rows.length;
    }

    // Restore in dependency order (items depend on orders, serials on products)

    // Independent tables first
    await restoreTable('deliveries', backup.tables.deliveries);
    await restoreTable('delivery_notes', backup.tables.delivery_notes);
    await restoreTable('service_jobs', backup.tables.service_jobs);
    await restoreTable('employees', backup.tables.employees);
    await restoreTable('time_clock', backup.tables.time_clock);
    await restoreTable('brands', backup.tables.brands);
    await restoreTable('vendors', backup.tables.vendors);

    // Departments before categories (FK)
    await restoreTable('departments', backup.tables.departments);
    await restoreTable('categories', backup.tables.categories);

    // Customers
    await restoreTable('customers', backup.tables.customers, { hasDeleted: true });

    // Products + serial pool
    // Products need to be inserted first, then serial_pool references product_id
    // Since we're restoring with original IDs stripped, we need to handle this differently
    // For products: insert and get new IDs, but serial_pool references are broken
    // Simplest safe approach: restore products, then restore serial_pool with product_id matching
    if (backup.tables.products && backup.tables.products.length) {
      await sb.from('serial_pool').delete().eq('store_id', store_id).eq('deleted', false);
      await sb.from('products').delete().eq('store_id', store_id).eq('deleted', false);

      // Insert products and track old_id → new_id mapping
      const idMap = {};
      for (let i = 0; i < backup.tables.products.length; i += 200) {
        const batch = backup.tables.products.slice(i, i + 200).map(r => {
          const { id, ...rest } = r;
          return { ...rest, _old_id: id };
        });
        // We can't pass _old_id to Supabase, so insert without it and match by index
        const cleanBatch = batch.map(({ _old_id, ...rest }) => rest);
        const { data: inserted, error } = await sb.from('products').insert(cleanBatch).select('id');
        if (error) { console.error('[Restore] products error:', error.message); continue; }
        batch.forEach((b, j) => {
          if (inserted[j]) idMap[b._old_id] = inserted[j].id;
        });
      }
      results.products = backup.tables.products.length;

      // Restore serial pool with mapped product_ids
      if (backup.tables.serial_pool && backup.tables.serial_pool.length) {
        const serialRows = backup.tables.serial_pool
          .map(r => {
            const { id, ...rest } = r;
            return { ...rest, product_id: idMap[r.product_id] || r.product_id };
          })
          .filter(r => r.product_id); // skip orphans
        for (let i = 0; i < serialRows.length; i += 500) {
          const batch = serialRows.slice(i, i + 500);
          const { error } = await sb.from('serial_pool').insert(batch);
          if (error) console.error('[Restore] serial_pool error:', error.message);
        }
        results.serial_pool = serialRows.length;
      }
    }

    // Orders + order_items
    if (backup.tables.orders && backup.tables.orders.length) {
      await sb.from('order_items').delete().eq('store_id', store_id).eq('deleted', false);
      await sb.from('orders').delete().eq('store_id', store_id).eq('deleted', false);

      const orderIdMap = {};
      for (const o of backup.tables.orders) {
        const { id, ...rest } = o;
        const { data: inserted, error } = await sb.from('orders').insert(rest).select('id').single();
        if (error) { console.error('[Restore] order error:', error.message); continue; }
        orderIdMap[id] = inserted.id;
      }
      results.orders = backup.tables.orders.length;

      // Restore order items with mapped order_ids
      if (backup.tables.order_items && backup.tables.order_items.length) {
        const itemRows = backup.tables.order_items.map(r => {
          const { id, ...rest } = r;
          return { ...rest, order_id: orderIdMap[r.order_id] || r.order_id };
        });
        for (let i = 0; i < itemRows.length; i += 500) {
          const { error } = await sb.from('order_items').insert(itemRows.slice(i, i + 500));
          if (error) console.error('[Restore] order_items error:', error.message);
        }
        results.order_items = itemRows.length;
      }
    }

    // Restore counters
    if (backup.tables.counters && backup.tables.counters.length) {
      for (const c of backup.tables.counters) {
        await sb.from('counters').upsert(
          { store_id: c.store_id, key: c.key, value: c.value },
          { onConflict: 'store_id,key' }
        );
      }
      results.counters = backup.tables.counters.length;
    }

    // Restore store_config
    if (backup.tables.store_config && backup.tables.store_config.length) {
      for (const c of backup.tables.store_config) {
        // Don't overwrite backup-history itself
        if (c.key === 'backup-history') continue;
        await sb.from('store_config').upsert(
          { store_id: c.store_id, key: c.key, data: c.data },
          { onConflict: 'store_id,key' }
        );
      }
      results.store_config = backup.tables.store_config.length;
    }

    const totalRestored = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`[Restore] Restored ${totalRestored} records from backup ${url}`);

    return res.status(200).json({ ok: true, results, total_restored: totalRestored, backup_date: backup.created_at });

  } catch (err) {
    console.error('[Restore] FAILED:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
