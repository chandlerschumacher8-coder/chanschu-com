// api/admin-clear.js — Soft delete for Clear Data operations
// Sets deleted=true + deleted_at instead of hard deleting rows
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const { type } = req.body;
    if (!type || !['inventory', 'sales', 'customers', 'all'].includes(type)) {
      return res.status(400).json({ ok: false, error: 'Invalid type. Use: inventory, sales, customers, or all' });
    }

    if (!useSupabase()) {
      return res.status(400).json({ ok: false, error: 'Soft delete requires Supabase. Redis fallback uses hard delete.' });
    }

    const store_id = session.store_id || 1;
    const sb = getSupabase();
    const now = new Date().toISOString();
    const results = {};

    // ── Clear Inventory (products + serial_pool) ──
    if (type === 'inventory' || type === 'all') {
      // Count before soft delete
      const { count: productCount } = await sb
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store_id)
        .eq('deleted', false);

      const { count: serialCount } = await sb
        .from('serial_pool')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store_id)
        .eq('deleted', false);

      // Soft delete products
      const { error: prodErr } = await sb
        .from('products')
        .update({ deleted: true, deleted_at: now })
        .eq('store_id', store_id)
        .eq('deleted', false);
      if (prodErr) throw new Error('Product soft delete failed: ' + prodErr.message);

      // Soft delete serial pool
      const { error: serialErr } = await sb
        .from('serial_pool')
        .update({ deleted: true, deleted_at: now })
        .eq('store_id', store_id)
        .eq('deleted', false);
      if (serialErr) throw new Error('Serial pool soft delete failed: ' + serialErr.message);

      results.inventory = { products: productCount || 0, serials: serialCount || 0 };
    }

    // ── Clear Sales History (orders + order_items) ──
    if (type === 'sales' || type === 'all') {
      const { count: orderCount } = await sb
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store_id)
        .eq('deleted', false);

      const { count: itemCount } = await sb
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store_id)
        .eq('deleted', false);

      // Soft delete orders
      const { error: ordErr } = await sb
        .from('orders')
        .update({ deleted: true, deleted_at: now })
        .eq('store_id', store_id)
        .eq('deleted', false);
      if (ordErr) throw new Error('Order soft delete failed: ' + ordErr.message);

      // Soft delete order items
      const { error: itemErr } = await sb
        .from('order_items')
        .update({ deleted: true, deleted_at: now })
        .eq('store_id', store_id)
        .eq('deleted', false);
      if (itemErr) throw new Error('Order items soft delete failed: ' + itemErr.message);

      // Reset order counter
      await sb.from('counters').upsert(
        { store_id, key: 'next_order_id', value: 1001 },
        { onConflict: 'store_id,key' }
      );
      await sb.from('counters').upsert(
        { store_id, key: 'next_quote_id', value: 1 },
        { onConflict: 'store_id,key' }
      );

      results.sales = { orders: orderCount || 0, items: itemCount || 0 };
    }

    // ── Clear Customers ──
    if (type === 'customers' || type === 'all') {
      const { count: custCount } = await sb
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store_id)
        .eq('deleted', false);

      const { error: custErr } = await sb
        .from('customers')
        .update({ deleted: true, deleted_at: now })
        .eq('store_id', store_id)
        .eq('deleted', false);
      if (custErr) throw new Error('Customer soft delete failed: ' + custErr.message);

      results.customers = { count: custCount || 0 };
    }

    return res.status(200).json({ ok: true, type, deleted_at: now, results });
  } catch (err) {
    console.error('[admin-clear] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
