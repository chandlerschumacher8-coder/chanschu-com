// api/deliveries-get.js
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();

      // Get deliveries
      const { data: delRows, error: delErr } = await sb
        .from('deliveries')
        .select('*')
        .eq('store_id', store_id)
        .order('date', { ascending: true });
      if (delErr) throw new Error(delErr.message);

      // Get notes
      const { data: noteRows, error: noteErr } = await sb
        .from('delivery_notes')
        .select('*')
        .eq('store_id', store_id)
        .order('date', { ascending: true });
      if (noteErr) throw new Error(noteErr.message);

      // Get counters
      const { data: counters } = await sb
        .from('counters')
        .select('key, value')
        .eq('store_id', store_id)
        .in('key', ['next_delivery_id', 'next_note_id']);
      const counterMap = {};
      (counters || []).forEach(c => { counterMap[c.key] = c.value; });

      // Map to frontend format
      const deliveries = (delRows || []).map(d => ({
        id: d.delivery_id,
        name: d.name,
        phone: d.phone,
        email: d.email,
        address: d.address,
        city: d.city,
        invoice: d.invoice,
        notes: d.notes,
        date: d.date,
        time: d.time,
        duration: d.duration,
        team: d.team,
        stopOrder: d.stop_order,
        deliveryType: d.delivery_type,
        status: d.status,
        appliances: d.appliances || [],
        invoiceFiles: d.invoice_files || [],
        photos: d.photos || [],
        emailLog: d.email_log || [],
        log: d.log || [],
        linkedOrderId: d.linked_order_id,
        shipperNotes: d.shipper_notes,
        delivInstructions: d.deliv_instructions,
        soldTo: d.sold_to,
        shipTo: d.ship_to,
        clerk: d.clerk,
        saleDate: d.sale_date,
        orderItems: d.order_items || [],
        orderSubtotal: d.order_subtotal,
        orderTax: d.order_tax,
        orderTotal: d.order_total,
        orderPayment: d.order_payment,
        createdAt: d.created_at,
        deliveredAt: d.delivered_at,
        _dbId: d.id,
      }));

      const notes = (noteRows || []).map(n => ({
        id: n.note_id,
        title: n.title,
        date: n.date,
        allDay: n.all_day,
        time: n.time,
        duration: n.duration,
        details: n.details,
        color: n.color,
        createdAt: n.created_at,
        _dbId: n.id,
      }));

      return res.status(200).json({
        ok: true,
        deliveries,
        nextId: counterMap.next_delivery_id || 1,
        notes,
        nextNoteId: counterMap.next_note_id || 1,
      });
    }

    // Redis fallback
    const raw = await redis.get('dc-deliveries');
    const data = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : { deliveries: [], nextId: 1, notes: [], nextNoteId: 1 };
    return res.status(200).json({
      ok: true,
      deliveries: data.deliveries || [],
      nextId: data.nextId || 1,
      notes: data.notes || [],
      nextNoteId: data.nextNoteId || 1
    });
  } catch(err) {
    return res.status(500).json({ ok: false, error: err.message, deliveries: [], nextId: 1, notes: [], nextNoteId: 1 });
  }
}
