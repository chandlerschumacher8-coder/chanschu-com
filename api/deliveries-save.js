// api/deliveries-save.js — Individual record operations (no more full-array replace)
// Supports: upsert (single delivery/note), delete (single), and legacy bulk (backwards compat)
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
import { getSupabase, useSupabase } from './_supabase.js';
let _redis;
function getRedis() { if (!_redis) _redis = Redis.fromEnv(); return _redis; }

function mapDeliveryToRow(d, store_id) {
  return {
    store_id,
    delivery_id: d.id || 'DEL-0000',
    name: d.name || 'Unknown',
    phone: d.phone || null,
    email: d.email || null,
    address: d.address || null,
    city: d.city || null,
    invoice: d.invoice || null,
    notes: d.notes || null,
    date: d.date || new Date().toISOString().split('T')[0],
    time: d.time || null,
    duration: d.duration || null,
    team: d.team || null,
    stop_order: d.stopOrder || null,
    delivery_type: d.deliveryType || 'Full Install',
    status: d.status || 'Scheduled',
    appliances: d.appliances || [],
    invoice_files: d.invoiceFiles || (d.invoiceFile && d.invoiceFile.url ? [d.invoiceFile] : []),
    photos: d.photos || [],
    email_log: d.emailLog || [],
    log: d.log || [],
    linked_order_id: d.linkedOrderId || null,
    shipper_notes: d.shipperNotes || null,
    deliv_instructions: d.delivInstructions || null,
    sold_to: d.soldTo || null,
    ship_to: d.shipTo || null,
    clerk: d.clerk || null,
    sale_date: d.saleDate || null,
    order_items: d.orderItems || [],
    order_subtotal: d.orderSubtotal || null,
    order_tax: d.orderTax || null,
    order_total: d.orderTotal || null,
    order_payment: d.orderPayment || null,
    created_at: d.createdAt || new Date().toISOString(),
    delivered_at: d.deliveredAt || null,
  };
}

function mapNoteToRow(n, store_id) {
  return {
    store_id,
    note_id: n.id || 'NOTE-000',
    title: n.title || 'Note',
    date: n.date || new Date().toISOString().split('T')[0],
    all_day: n.allDay || false,
    time: n.time || null,
    duration: n.duration || null,
    details: n.details || null,
    color: n.color || 'blue',
    is_lunch: n.isLunch || false,
    is_full: n.isFull || false,
    created_at: n.createdAt || new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    const body = req.body;
    const store_id = session.store_id || 1;

    if (useSupabase()) {
      const sb = getSupabase();

      // ── INDIVIDUAL OPERATIONS (new pattern) ──
      if (body.action === 'upsert' && body.delivery) {
        const row = mapDeliveryToRow(body.delivery, store_id);
        console.log('[deliveries-save] Upserting delivery:', { id: row.delivery_id, invoice: row.invoice, linked_order_id: row.linked_order_id, name: row.name });
        const { error } = await sb.from('deliveries').upsert(row, { onConflict: 'store_id,delivery_id' });
        if (error) throw new Error('Delivery upsert failed: ' + error.message);
        return res.status(200).json({ ok: true, id: row.delivery_id });
      }

      if (body.action === 'upsert-note' && body.note) {
        const row = mapNoteToRow(body.note, store_id);
        const { error } = await sb.from('delivery_notes').upsert(row, { onConflict: 'store_id,note_id' });
        if (error) throw new Error('Note upsert failed: ' + error.message);
        return res.status(200).json({ ok: true, id: row.note_id });
      }

      if (body.action === 'delete' && body.id) {
        const { error } = await sb.from('deliveries').delete()
          .eq('store_id', store_id).eq('delivery_id', body.id);
        if (error) throw new Error('Delivery delete failed: ' + error.message);
        return res.status(200).json({ ok: true });
      }

      if (body.action === 'delete-note' && body.id) {
        const { error } = await sb.from('delivery_notes').delete()
          .eq('store_id', store_id).eq('note_id', body.id);
        if (error) throw new Error('Note delete failed: ' + error.message);
        return res.status(200).json({ ok: true });
      }

      if (body.action === 'update-counter') {
        if (body.nextId) await sb.from('counters').upsert({ store_id, key: 'next_delivery_id', value: body.nextId }, { onConflict: 'store_id,key' });
        if (body.nextNoteId) await sb.from('counters').upsert({ store_id, key: 'next_note_id', value: body.nextNoteId }, { onConflict: 'store_id,key' });
        return res.status(200).json({ ok: true });
      }

      // ── LEGACY BULK SAVE (backwards compatibility for any remaining callers) ──
      if (Array.isArray(body.deliveries)) {
        const { deliveries, nextId, notes, nextNoteId } = body;

        // Upsert deliveries individually
        for (const d of deliveries) {
          const row = mapDeliveryToRow(d, store_id);
          const { error } = await sb.from('deliveries').upsert(row, { onConflict: 'store_id,delivery_id' });
          if (error) console.error('Legacy delivery upsert failed:', error.message);
        }

        // Find deliveries in DB but not in payload — delete them
        const savedIds = new Set(deliveries.map(d => d.id || 'DEL-0000'));
        const { data: existing } = await sb.from('deliveries').select('delivery_id').eq('store_id', store_id);
        const toDelete = (existing || []).filter(d => !savedIds.has(d.delivery_id)).map(d => d.delivery_id);
        if (toDelete.length) {
          await sb.from('deliveries').delete().eq('store_id', store_id).in('delivery_id', toDelete);
        }

        // Upsert notes
        const noteArr = notes || [];
        for (const n of noteArr) {
          const row = mapNoteToRow(n, store_id);
          const { error } = await sb.from('delivery_notes').upsert(row, { onConflict: 'store_id,note_id' });
          if (error) console.error('Legacy note upsert failed:', error.message);
        }
        const savedNoteIds = new Set(noteArr.map(n => n.id || 'NOTE-000'));
        const { data: existingNotes } = await sb.from('delivery_notes').select('note_id').eq('store_id', store_id);
        const notesToDelete = (existingNotes || []).filter(n => !savedNoteIds.has(n.note_id)).map(n => n.note_id);
        if (notesToDelete.length) {
          await sb.from('delivery_notes').delete().eq('store_id', store_id).in('note_id', notesToDelete);
        }

        // Update counters
        await sb.from('counters').upsert({ store_id, key: 'next_delivery_id', value: nextId || deliveries.length + 1 }, { onConflict: 'store_id,key' });
        await sb.from('counters').upsert({ store_id, key: 'next_note_id', value: nextNoteId || noteArr.length + 1 }, { onConflict: 'store_id,key' });

        return res.status(200).json({ ok: true, count: deliveries.length });
      }

      return res.status(400).json({ ok: false, error: 'Invalid request — use action or deliveries array' });
    }

    // Redis fallback (legacy bulk only)
    const { deliveries, nextId, notes, nextNoteId } = body;
    if (!Array.isArray(deliveries)) return res.status(400).json({ ok: false, error: 'Invalid data' });
    await getRedis().set('dc-deliveries', JSON.stringify({
      deliveries,
      nextId: nextId || deliveries.length + 1,
      notes: notes || [],
      nextNoteId: nextNoteId || 1
    }));
    return res.status(200).json({ ok: true, count: deliveries.length });
  } catch(err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
