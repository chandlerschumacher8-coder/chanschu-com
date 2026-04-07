// api/deliveries-save.js
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

      // Replace all deliveries for this store
      await sb.from('deliveries').delete().eq('store_id', store_id);
      if (deliveries.length) {
        // Insert in batches of 100
        for (let i = 0; i < deliveries.length; i += 100) {
          const batch = deliveries.slice(i, i + 100).map(d => ({
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
            created_at: d.createdAt || new Date().toISOString(),
            delivered_at: d.deliveredAt || null,
          }));
          const { error } = await sb.from('deliveries').insert(batch);
          if (error) throw new Error(error.message);
        }
      }

      // Replace all notes
      await sb.from('delivery_notes').delete().eq('store_id', store_id);
      const noteArr = notes || [];
      if (noteArr.length) {
        const noteRows = noteArr.map(n => ({
          store_id,
          note_id: n.id || 'NOTE-000',
          title: n.title || 'Note',
          date: n.date || new Date().toISOString().split('T')[0],
          all_day: n.allDay || false,
          time: n.time || null,
          duration: n.duration || null,
          details: n.details || null,
          color: n.color || 'blue',
          created_at: n.createdAt || new Date().toISOString(),
        }));
        const { error } = await sb.from('delivery_notes').insert(noteRows);
        if (error) throw new Error(error.message);
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
