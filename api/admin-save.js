// api/admin-save.js — Generic key-value POST for POS admin data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const { key, data } = req.body;
    if (!key) return res.status(400).json({ ok: false, error: 'Missing key' });
    if (data === undefined) return res.status(400).json({ ok: false, error: 'Missing data' });

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();

      // ── Structured tables ──

      if (key === 'customers') {
        const customers = Array.isArray(data) ? data : [];
        // Only delete active (non-soft-deleted) records — soft-deleted records are preserved
        await sb.from('customers').delete().eq('store_id', store_id).eq('deleted', false);
        if (customers.length) {
          for (let i = 0; i < customers.length; i += 500) {
            const batch = customers.slice(i, i + 500).map(c => ({
              store_id, customer_num: c.customerNum || null, name: c.name || 'Unknown',
              phone: c.phone || null, cell: c.cell || null, fax: c.fax || null,
              email: c.email || null, address: c.address || null,
              city: c.city || null, state: c.state || null, zip: c.zip || null,
              notes: c.notes || null, email_opt_out: c.emailOptOut || false,
              ar_num: c.arNum || null, cid: c.cid || null,
              customer_class: c.class || null, customer_level: c.level || null,
              customer_type: c.type || null, flags: c.flags || null,
              contacts: c.contacts || [], demographics: c.demographics || null,
              appliance_history: c.applianceHistory || [],
              payments: c.payments || [], adjustments: c.adjustments || [],
              refunds: c.refunds || [], ledger_notes: c.ledgerNotes || [],
              deleted: false,
            }));
            const { error } = await sb.from('customers').insert(batch);
            if (error) throw new Error(error.message);
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (key === 'products') {
        const products = Array.isArray(data) ? data : [];
        // Only delete active (non-soft-deleted) records — soft-deleted records are preserved
        await sb.from('serial_pool').delete().eq('store_id', store_id).eq('deleted', false);
        await sb.from('products').delete().eq('store_id', store_id).eq('deleted', false);
        if (products.length) {
          for (let i = 0; i < products.length; i += 200) {
            const batch = products.slice(i, i + 200);
            const rows = batch.map(p => ({
              store_id, sku: p.sku || null, upc: p.upc || null, model: p.model || null,
              name: p.name || 'Product', brand: p.brand || null, category: p.cat || null,
              vendor: p.vendor || null, icon: p.icon || null, price: p.price || 0,
              cost: p.cost || 0, stock: p.stock || 0, sold: p.sold || 0,
              reorder_pt: p.reorderPt || 0, reorder_qty: p.reorderQty || 0,
              sales_30: p.sales30 || 0, warranty: p.warranty || null, serial: p.serial || null,
              serial_tracked: p.serialTracked || false, price_locked: p.priceLocked || false,
              needs_pricing: p.needsPricing || false, active: p.active !== false,
              deleted: false,
            }));
            const { data: inserted, error } = await sb.from('products').insert(rows).select('id');
            if (error) throw new Error(error.message);
            for (let j = 0; j < batch.length; j++) {
              const p = batch[j];
              const dbId = inserted[j]?.id;
              if (p.serialPool && Array.isArray(p.serialPool) && p.serialPool.length && dbId) {
                const serialRows = p.serialPool.map(s => ({
                  store_id, product_id: dbId, sn: s.sn || '', status: s.status || 'available',
                  assigned_at: s.assignedAt || null, received_at: s.receivedAt || null, vendor: s.vendor || null,
                  deleted: false,
                }));
                await sb.from('serial_pool').insert(serialRows);
              }
            }
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (key === 'orders') {
        const orderData = data || {};
        const orders = orderData.orders || [];
        // Only delete active (non-soft-deleted) records — soft-deleted records are preserved
        await sb.from('order_items').delete().eq('store_id', store_id).eq('deleted', false);
        await sb.from('orders').delete().eq('store_id', store_id).eq('deleted', false);
        for (const o of orders) {
          const { data: inserted, error } = await sb.from('orders').insert({
            store_id, order_id: o.id || 'ORD-0000', customer: o.customer || null,
            subtotal: o.subtotal || 0, tax: o.tax || 0, total: o.total || 0,
            tax_zone: o.taxZone || null, payment: o.payment || null,
            status: o.status || 'Awaiting Delivery',
            date: o.date || new Date().toISOString(),
            invoice_notes: o.invoiceNotes || null, shipper_notes: o.shipperNotes || null,
            sold_to: o.soldTo || null, ship_to: o.shipTo || null,
            clerk: o.clerk || null, po: o.po || null, job: o.job || null,
            notes: o.notes || null, address: o.address || null,
            delivery_date: o.deliveryDate || null, delivery_time: o.deliveryTime || null,
            payments: o.payments || [],
            email_log: o.emailLog || [],
            linked_delivery_id: o.deliveryId || null,
            delivery_status: o.deliveryStatus || null,
            deleted: false,
          }).select('id').single();
          if (error) { console.error('Order insert error:', error.message); continue; }
          if (o.items && o.items.length) {
            const itemRows = o.items.map(it => ({
              store_id, order_id: inserted.id, product_id: it.id || null,
              name: it.name || 'Item',
              model: it.model || null, price: it.price || 0, qty: it.qty || 1,
              serial: it.serial || null, discount: it.discount || 0,
              discount_pct: it.discountPct || 0, orig_price: it.origPrice || null,
              serial_tracked: it.serialTracked || false, price_matched: it.priceMatched || false,
              price_match_info: it.priceMatchInfo || null, is_service: it.isService || false,
              commission_rate: it.commissionRate || null, commission_earned: it.commissionEarned || null,
              delivered: it.delivered || false, delivered_at: it.deliveredAt || null,
              delivered_by: it.deliveredBy || null,
              warranty_status: it.warrantyStatus || null,
              deleted: false,
            }));
            await sb.from('order_items').insert(itemRows);
          }
        }
        await sb.from('counters').upsert({ store_id, key: 'next_order_id', value: orderData.nextOrderId || orders.length + 1 }, { onConflict: 'store_id,key' });
        await sb.from('counters').upsert({ store_id, key: 'next_quote_id', value: orderData.nextQuoteId || 1 }, { onConflict: 'store_id,key' });
        return res.status(200).json({ ok: true });
      }

      if (key === 'admin-brands') {
        const brands = Array.isArray(data) ? data : [];
        await sb.from('brands').delete().eq('store_id', store_id);
        if (brands.length) {
          const rows = brands.map(b => ({ store_id, name: typeof b === 'string' ? b : b.name || 'Unknown' }));
          const { error } = await sb.from('brands').insert(rows);
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ ok: true });
      }

      if (key === 'admin-vendors') {
        const vendors = Array.isArray(data) ? data : [];
        await sb.from('vendors').delete().eq('store_id', store_id);
        if (vendors.length) {
          const rows = vendors.map(v => ({
            store_id, name: v.name || 'Unknown', rep_name: v.repName || null,
            phone: v.phone || null, email: v.email || null,
            account_num: v.accountNum || null, payment_terms: v.paymentTerms || null,
          }));
          const { error } = await sb.from('vendors').insert(rows);
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ ok: true });
      }

      if (key === 'admin-categories') {
        // Incoming: flat array of {name, dept}
        const cats = Array.isArray(data) ? data : [];
        await sb.from('categories').delete().eq('store_id', store_id);
        await sb.from('departments').delete().eq('store_id', store_id);
        // Group by dept
        const deptMap = {};
        cats.forEach(c => {
          const d = c.dept || 'Uncategorized';
          if (!deptMap[d]) deptMap[d] = [];
          deptMap[d].push(c.name || 'Unknown');
        });
        for (const [deptName, catNames] of Object.entries(deptMap)) {
          const { data: deptRow, error: dErr } = await sb.from('departments')
            .insert({ store_id, name: deptName }).select('id').single();
          if (dErr) { console.error('Dept insert:', dErr.message); continue; }
          if (catNames.length) {
            const catRows = catNames.map(n => ({ store_id, department_id: deptRow.id, name: n }));
            const { error: cErr } = await sb.from('categories').insert(catRows);
            if (cErr) console.error('Cat insert:', cErr.message);
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (key === 'timeclock-punches') {
        const punches = Array.isArray(data) ? data : [];
        await sb.from('time_clock').delete().eq('store_id', store_id);
        if (punches.length) {
          for (let i = 0; i < punches.length; i += 500) {
            const batch = punches.slice(i, i + 500).map(p => ({
              store_id, punch_id: p.id || null, employee: p.employee || 'Unknown',
              date: p.date || new Date().toISOString().split('T')[0],
              clock_in: p.clockIn || new Date().toISOString(),
              clock_out: p.clockOut || null, type: p.type || 'regular', hours: p.hours || null,
            }));
            const { error } = await sb.from('time_clock').insert(batch);
            if (error) throw new Error(error.message);
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (key === 'stores') {
        // Update the stores table row
        const storeArr = Array.isArray(data) ? data : [data];
        const s = storeArr[0];
        if (s) {
          const { error } = await sb.from('stores').update({
            name: s.store_name || s.name || undefined,
            subdomain: s.subdomain || undefined,
            address: s.address || null, city: s.city || null,
            state: s.state || null, zip: s.zip || null,
            phone: s.phone || null, email: s.email || null,
            logo_url: s.logo_url || null, primary_color: s.primary_color || null,
            tagline: s.tagline || null, tax_county: s.tax_county || null,
            tax_rate: s.tax_rate || null, store_hours: s.store_hours || null,
            invoice_message: s.invoice_message || null, delivery_terms: s.delivery_terms || null,
            rent_amount: s.rent_amount || null, landlord_name: s.landlord_name || null,
            credit_card_names: s.credit_card_names || null, bank_names: s.bank_names || null,
          }).eq('id', store_id);
          if (error) throw new Error(error.message);
        }
        return res.status(200).json({ ok: true });
      }

      // ── Generic config keys → store_config table ──
      // Handles: admin-commissions, admin-tax-zones, pos-settings,
      // hot-buttons, commission-rates, quotes, merge-history,
      // data-clear-log, sales-import-history, serial-import-history, etc.
      const { error: upsertErr } = await sb.from('store_config').upsert(
        { store_id, key, data },
        { onConflict: 'store_id,key' }
      );
      if (upsertErr) throw new Error(upsertErr.message);
      return res.status(200).json({ ok: true });
    }

    // Redis fallback
    await redis.set('pos:' + key, JSON.stringify(data));
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
