#!/usr/bin/env node
// ============================================================
// RECOVERY SCRIPT: Restore deliveries from Redis → Supabase
// Run: node recover-deliveries.mjs
// ============================================================

import { readFileSync } from 'fs';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually (no dotenv dependency)
try {
  const envFile = readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=["']?(.*?)["']?\s*$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2];
  });
} catch (e) { /* ignore if missing */ }

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const STORE_ID = 1;

function parse(raw) {
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function run() {
  console.log('=== DELIVERY RECOVERY SCRIPT ===\n');

  // Step 1: Read from Redis
  console.log('1. Reading from Redis key: dc-deliveries ...');
  const raw = await redis.get('dc-deliveries');
  const data = parse(raw);
  if (!data) {
    console.error('ERROR: No data found in Redis key dc-deliveries');
    process.exit(1);
  }

  const allDeliveries = data.deliveries || [];
  const allNotes = data.notes || [];
  const nextId = data.nextId || 1;
  const nextNoteId = data.nextNoteId || 1;

  console.log(`   Redis has ${allDeliveries.length} deliveries, ${allNotes.length} notes`);
  console.log(`   nextId: ${nextId}, nextNoteId: ${nextNoteId}`);

  // Show date breakdown
  const dateCounts = {};
  allDeliveries.forEach(d => { dateCounts[d.date] = (dateCounts[d.date] || 0) + 1; });
  console.log('   Deliveries by date:', JSON.stringify(dateCounts));

  if (allDeliveries.length === 0) {
    console.error('ERROR: Redis also has 0 deliveries — nothing to recover');
    process.exit(1);
  }

  // Step 2: Check current Supabase state
  console.log('\n2. Checking current Supabase state ...');
  const { data: existingDels, error: delErr } = await supabase
    .from('deliveries')
    .select('id, delivery_id, date')
    .eq('store_id', STORE_ID);
  if (delErr) { console.error('Supabase read error:', delErr.message); process.exit(1); }
  console.log(`   Supabase currently has ${existingDels.length} deliveries`);

  const { data: existingNotes, error: noteErr } = await supabase
    .from('delivery_notes')
    .select('id, note_id, date')
    .eq('store_id', STORE_ID);
  if (noteErr) { console.error('Supabase read error:', noteErr.message); process.exit(1); }
  console.log(`   Supabase currently has ${existingNotes.length} notes`);

  // Step 3: Delete existing deliveries (they're empty/stale)
  console.log('\n3. Clearing existing Supabase deliveries ...');
  const { error: clearErr } = await supabase
    .from('deliveries')
    .delete()
    .eq('store_id', STORE_ID);
  if (clearErr) { console.error('Delete error:', clearErr.message); process.exit(1); }
  console.log('   Cleared.');

  // Step 4: Insert deliveries from Redis in batches of 50
  console.log(`\n4. Inserting ${allDeliveries.length} deliveries into Supabase ...`);
  let inserted = 0;
  for (let i = 0; i < allDeliveries.length; i += 50) {
    const batch = allDeliveries.slice(i, i + 50).map(d => ({
      store_id: STORE_ID,
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
    }));
    const { error } = await supabase.from('deliveries').insert(batch);
    if (error) {
      console.error(`   Batch ${i}-${i + batch.length} FAILED:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`   Inserted batch ${Math.floor(i / 50) + 1}: ${batch.length} rows (${inserted}/${allDeliveries.length})`);
  }

  // Step 5: Update counter
  console.log('\n5. Updating next_delivery_id counter ...');
  await supabase.from('counters').upsert(
    { store_id: STORE_ID, key: 'next_delivery_id', value: nextId },
    { onConflict: 'store_id,key' }
  );
  console.log(`   Set next_delivery_id = ${nextId}`);

  // Step 6: Verify
  console.log('\n6. Verifying ...');
  const { data: verifyDels, error: vErr } = await supabase
    .from('deliveries')
    .select('delivery_id, date, name, status')
    .eq('store_id', STORE_ID);
  if (vErr) { console.error('Verify error:', vErr.message); process.exit(1); }
  console.log(`   Supabase now has ${verifyDels.length} deliveries`);

  const vDateCounts = {};
  verifyDels.forEach(d => { vDateCounts[d.date] = (vDateCounts[d.date] || 0) + 1; });
  console.log('   Deliveries by date:', JSON.stringify(vDateCounts));

  if (verifyDels.length === allDeliveries.length) {
    console.log(`\n✅ SUCCESS: Recovered ${verifyDels.length} deliveries (matches Redis count of ${allDeliveries.length})`);
  } else {
    console.error(`\n⚠ COUNT MISMATCH: Redis had ${allDeliveries.length}, Supabase now has ${verifyDels.length}`);
  }

  // Show a few sample records
  console.log('\nSample deliveries:');
  verifyDels.slice(0, 5).forEach(d => {
    console.log(`   ${d.delivery_id} | ${d.date} | ${d.name} | ${d.status}`);
  });
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
