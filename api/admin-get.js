// api/admin-get.js — Generic key-value GET for POS admin data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ ok: false, error: 'Missing key parameter' });

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();

      // ── Structured tables ──

      if (key === 'customers') {
        const { data, error } = await sb.from('customers').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(c => ({
          name: c.name, phone: c.phone, email: c.email, address: c.address,
          city: c.city, state: c.state, zip: c.zip, customerNum: c.customer_num,
          notes: c.notes, emailOptOut: c.email_opt_out, applianceHistory: c.appliance_history || [],
          payments: c.payments || [], adjustments: c.adjustments || [],
          refunds: c.refunds || [], ledgerNotes: c.ledger_notes || [],
          _dbId: c.id,
        })) });
      }

      if (key === 'products') {
        const { data, error } = await sb.from('products').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        const productIds = (data || []).map(p => p.id);
        let serialMap = {};
        if (productIds.length) {
          const { data: serials } = await sb.from('serial_pool').select('*').eq('store_id', store_id).in('product_id', productIds);
          (serials || []).forEach(s => {
            if (!serialMap[s.product_id]) serialMap[s.product_id] = [];
            serialMap[s.product_id].push({ sn: s.sn, status: s.status, assignedAt: s.assigned_at, receivedAt: s.received_at, vendor: s.vendor });
          });
        }
        return res.status(200).json({ ok: true, data: (data || []).map(p => ({
          id: p.id, sku: p.sku, upc: p.upc, model: p.model, name: p.name,
          brand: p.brand, cat: p.category, vendor: p.vendor, icon: p.icon,
          price: p.price, cost: p.cost, stock: p.stock, sold: p.sold,
          reorderPt: p.reorder_pt, reorderQty: p.reorder_qty, sales30: p.sales_30,
          warranty: p.warranty, serial: p.serial, serialTracked: p.serial_tracked,
          priceLocked: p.price_locked, needsPricing: p.needs_pricing, active: p.active,
          serialPool: serialMap[p.id] || [],
        })) });
      }

      if (key === 'orders') {
        const { data: orderRows, error } = await sb.from('orders').select('*').eq('store_id', store_id).order('date', { ascending: false });
        if (error) throw new Error(error.message);
        const orderDbIds = (orderRows || []).map(o => o.id);
        let itemMap = {};
        if (orderDbIds.length) {
          const { data: items } = await sb.from('order_items').select('*').eq('store_id', store_id).in('order_id', orderDbIds);
          (items || []).forEach(it => {
            if (!itemMap[it.order_id]) itemMap[it.order_id] = [];
            itemMap[it.order_id].push({
              id: it.product_id, name: it.name, model: it.model, price: it.price,
              qty: it.qty, serial: it.serial, discount: it.discount,
              discountPct: it.discount_pct, origPrice: it.orig_price,
              serialTracked: it.serial_tracked, priceMatched: it.price_matched,
              priceMatchInfo: it.price_match_info, isService: it.is_service,
              commissionRate: it.commission_rate, commissionEarned: it.commission_earned,
              delivered: it.delivered, deliveredAt: it.delivered_at, deliveredBy: it.delivered_by,
            });
          });
        }
        const { data: counters } = await sb.from('counters').select('key, value').eq('store_id', store_id).in('key', ['next_order_id', 'next_quote_id']);
        const counterMap = {};
        (counters || []).forEach(c => { counterMap[c.key] = c.value; });
        const orders = (orderRows || []).map(o => ({
          id: o.order_id, customer: o.customer, subtotal: o.subtotal, tax: o.tax,
          total: o.total, taxZone: o.tax_zone, payment: o.payment, status: o.status,
          date: o.date, invoiceNotes: o.invoice_notes, shipperNotes: o.shipper_notes,
          soldTo: o.sold_to, shipTo: o.ship_to, clerk: o.clerk, po: o.po,
          job: o.job, notes: o.notes, address: o.address,
          deliveryDate: o.delivery_date, deliveryTime: o.delivery_time,
          deliveryId: o.linked_delivery_id || null,
          deliveryStatus: o.delivery_status || null,
          payments: o.payments || [],
          items: itemMap[o.id] || [],
          _dbId: o.id,
        }));
        return res.status(200).json({ ok: true, data: {
          orders,
          nextOrderId: counterMap.next_order_id || orders.length + 1,
          nextQuoteId: counterMap.next_quote_id || 1,
        }});
      }

      if (key === 'admin-brands') {
        const { data, error } = await sb.from('brands').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(b => b.name) });
      }

      if (key === 'admin-vendors') {
        const { data, error } = await sb.from('vendors').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(v => ({
          name: v.name, repName: v.rep_name, phone: v.phone, email: v.email,
          accountNum: v.account_num, paymentTerms: v.payment_terms, _dbId: v.id,
        })) });
      }

      if (key === 'admin-categories') {
        // Return flat array of {name, dept} for frontend
        const { data: cats, error } = await sb.from('categories').select('*, departments(name)').eq('store_id', store_id);
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (cats || []).map(c => ({
          name: c.name,
          dept: c.departments ? c.departments.name : 'Uncategorized',
        })) });
      }

      if (key === 'timeclock-punches') {
        const { data, error } = await sb.from('time_clock').select('*').eq('store_id', store_id).order('clock_in', { ascending: false });
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(p => ({
          id: p.punch_id || String(p.id), employee: p.employee, date: p.date,
          clockIn: p.clock_in, clockOut: p.clock_out, type: p.type, hours: p.hours,
          _dbId: p.id,
        })) });
      }

      if (key === 'stores') {
        const { data, error } = await sb.from('stores').select('*').eq('id', store_id).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        if (!data) return res.status(200).json({ ok: true, data: null });
        return res.status(200).json({ ok: true, data: [{
          store_id: data.id, store_name: data.name, subdomain: data.subdomain,
          address: data.address, city: data.city, state: data.state, zip: data.zip,
          phone: data.phone, email: data.email, logo_url: data.logo_url,
          primary_color: data.primary_color, tagline: data.tagline,
          tax_county: data.tax_county, tax_rate: data.tax_rate,
          store_hours: data.store_hours, invoice_message: data.invoice_message,
          delivery_terms: data.delivery_terms, rent_amount: data.rent_amount,
          landlord_name: data.landlord_name, credit_card_names: data.credit_card_names,
          bank_names: data.bank_names, subscription_tier: data.subscription_tier,
          subscription_status: data.subscription_status,
        }] });
      }

      // ── Generic config keys (store_config table) ──
      // Handles: admin-commissions, admin-tax-zones, pos-settings,
      // hot-buttons, commission-rates, quotes, merge-history,
      // data-clear-log, sales-import-history, serial-import-history, etc.
      const { data: cfg, error: cfgErr } = await sb
        .from('store_config')
        .select('data')
        .eq('store_id', store_id)
        .eq('key', key)
        .single();
      if (cfgErr && cfgErr.code !== 'PGRST116') throw new Error(cfgErr.message);
      return res.status(200).json({ ok: true, data: cfg ? cfg.data : null });
    }

    // Redis fallback
    const raw = await redis.get('pos:' + key);
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, data: null });
  }
}
