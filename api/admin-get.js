// api/admin-get.js — Generic key-value GET for POS admin data
import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

// Map POS keys to Supabase tables
const KEY_TABLE_MAP = {
  customers: 'customers',
  inventory: 'products',
  orders: 'orders',
  brands: 'brands',
  vendors: 'vendors',
  departments: 'departments',
  'timeclock-punches': 'time_clock',
};

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
      const table = KEY_TABLE_MAP[key];

      if (key === 'customers') {
        const { data, error } = await sb.from('customers').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(c => ({
          name: c.name, phone: c.phone, email: c.email, address: c.address,
          city: c.city, state: c.state, zip: c.zip, customerNum: c.customer_num,
          notes: c.notes, emailOptOut: c.email_opt_out, applianceHistory: c.appliance_history || [],
          _dbId: c.id,
        })) });
      }

      if (key === 'inventory') {
        const { data, error } = await sb.from('products').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        // Also fetch serial pools
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
        // Fetch all items for these orders
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
        // Get counters
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
          items: itemMap[o.id] || [],
          _dbId: o.id,
        }));
        return res.status(200).json({ ok: true, data: {
          orders,
          nextOrderId: counterMap.next_order_id || orders.length + 1,
          nextQuoteId: counterMap.next_quote_id || 1,
        }});
      }

      if (key === 'brands') {
        const { data, error } = await sb.from('brands').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(b => b.name) });
      }

      if (key === 'vendors') {
        const { data, error } = await sb.from('vendors').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        return res.status(200).json({ ok: true, data: (data || []).map(v => ({
          name: v.name, repName: v.rep_name, phone: v.phone, email: v.email,
          accountNum: v.account_num, paymentTerms: v.payment_terms, _dbId: v.id,
        })) });
      }

      if (key === 'departments') {
        const { data: depts, error } = await sb.from('departments').select('*').eq('store_id', store_id).order('name');
        if (error) throw new Error(error.message);
        // Fetch categories grouped by department
        const { data: cats } = await sb.from('categories').select('*').eq('store_id', store_id);
        const catMap = {};
        (cats || []).forEach(c => {
          if (!catMap[c.department_id]) catMap[c.department_id] = [];
          catMap[c.department_id].push(c.name);
        });
        return res.status(200).json({ ok: true, data: (depts || []).map(d => ({
          name: d.name, cats: catMap[d.id] || [], _dbId: d.id,
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

      // Unknown key — return null
      return res.status(200).json({ ok: true, data: null });
    }

    // Redis fallback
    const raw = await redis.get('pos:' + key);
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, data: null });
  }
}
