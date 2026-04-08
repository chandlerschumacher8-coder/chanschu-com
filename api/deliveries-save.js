// api/deliveries-save.js — SAFE upsert-based save (no destructive delete-all)
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
import { getSupabase, useSupabase } from './_supabase.js';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  const session = await validateSession(req);
  if (!session) return unauthorized(res);
  try {
    const { deliveries, nextId, notes, nextNoteId } = req.body;
    if (!Array.isArray(deliveries)) return res.status(400).json({ ok: false, error: 'Invalid data' });

    if (useSupabase()) {
      const store_id = session.store_id || 1;
      const sb = getSupabase();

      // ── DELIVERIES: upsert by (store_id, delivery_id) ──
      // Build set of delivery_ids being saved
      const savedDelIds = new Set();
      if (deliveries.length) {
        for (let i = 0; i < deliveries.length; i += 100) {
          const batch = deliveries.slice(i, i + 100).map(d => {
            savedDelIds.add(d.id || 'DEL-0000');
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
          });
          const { error } = await sb.from('deliveries').upsert(batch, { onConflict: 'store_id,delivery_id' });
          if (error) throw new Error('Delivery upsert failed: ' + error.message);
        }
      }

      // Delete only deliveries that were explicitly removed by the client
      // (present in DB but absent from the payload)
      const { data: existingDels } = await sb
        .from('deliveries')
        .select('delivery_id')
        .eq('store_id', store_id);
      const toDelete = (existingDels || [])
        .filter(d => !savedDelIds.has(d.delivery_id))
        .map(d => d.delivery_id);
      if (toDelete.length) {
        await sb.from('deliveries').delete()
          .eq('store_id', store_id)
          .in('delivery_id', toDelete);
      }

      // ── NOTES: upsert by (store_id, note_id) ──
      const noteArr = notes || [];
      const savedNoteIds = new Set();
      if (noteArr.length) {
        const noteRows = noteArr.map(n => {
          savedNoteIds.add(n.id || 'NOTE-000');
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
        });
        const { error } = await sb.from('delivery_notes').upsert(noteRows, { onConflict: 'store_id,note_id' });
        if (error) throw new Error('Note upsert failed: ' + error.message);
      }

      // Delete only notes that were explicitly removed
      const { data: existingNotes } = await sb
        .from('delivery_notes')
        .select('note_id')
        .eq('store_id', store_id);
      const notesToDelete = (existingNotes || [])
        .filter(n => !savedNoteIds.has(n.note_id))
        .map(n => n.note_id);
      if (notesToDelete.length) {
        await sb.from('delivery_notes').delete()
          .eq('store_id', store_id)
          .in('note_id', notesToDelete);
      }

      // Update counters
      await sb.from('counters').upsert({ store_id, key: 'next_delivery_id', value: nextId || deliveries.length + 1 }, { onConflict: 'store_id,key' });
      await sb.from('counters').upsert({ store_id, key: 'next_note_id', value: nextNoteId || noteArr.length + 1 }, { onConflict: 'store_id,key' });

      return res.status(200).json({ ok: true, count: deliveries.length });
    }

    // Redis fallback
    await redis.set('dc-deliveries', JSON.stringify({
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
