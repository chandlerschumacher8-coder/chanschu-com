#!/usr/bin/env node
// ============================================================
// RECOVERY SCRIPT: Restore deliveries from Redis → Supabase (UPSERT)
// Run: node recover-deliveries.mjs
// ============================================================

import { readFileSync } from 'fs';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
try {
  const envFile = readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=["']?(.*?)["']?\s*$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2];
  });
} catch (e) { /* ignore */ }

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
  console.log('=== DELIVERY RECOVERY (UPSERT) ===\n');

  // Step 1: Read from Redis
  console.log('1. Reading Redis key: dc-deliveries ...');
  const raw = await redis.get('dc-deliveries');
  const data = parse(raw);
  if (!data) { console.error('ERROR: No data in Redis'); process.exit(1); }

  const allDeliveries = data.deliveries || [];
  const nextId = data.nextId || 1;
  console.log(`   Redis: ${allDeliveries.length} deliveries, nextId=${nextId}`);

  if (allDeliveries.length === 0) { console.error('ERROR: Redis has 0 deliveries'); process.exit(1); }

  // Date breakdown
  const dateCounts = {};
  allDeliveries.forEach(d => { dateCounts[d.date] = (dateCounts[d.date] || 0) + 1; });
  console.log('   By date:', JSON.stringify(dateCounts));

  // Step 2: Check Supabase before
  console.log('\n2. Supabase before recovery ...');
  const { data: before } = await supabase.from('deliveries').select('delivery_id').eq('store_id', STORE_ID);
  console.log(`   Supabase has ${(before || []).length} deliveries`);

  // Step 3: Upsert deliveries in batches
  console.log(`\n3. Upserting ${allDeliveries.length} deliveries ...`);
  let upserted = 0;
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
    const { error } = await supabase.from('deliveries').upsert(batch, { onConflict: 'store_id,delivery_id' });
    if (error) { console.error(`   Batch FAILED:`, error.message); process.exit(1); }
    upserted += batch.length;
    console.log(`   Batch ${Math.floor(i / 50) + 1}: ${batch.length} rows (${upserted}/${allDeliveries.length})`);
  }

  // Step 4: Update counter
  console.log('\n4. Updating counter ...');
  await supabase.from('counters').upsert(
    { store_id: STORE_ID, key: 'next_delivery_id', value: nextId },
    { onConflict: 'store_id,key' }
  );
  console.log(`   next_delivery_id = ${nextId}`);

  // Step 5: Verify
  console.log('\n5. Verifying ...');
  const { data: after, error: vErr } = await supabase
    .from('deliveries')
    .select('delivery_id, date, name, status')
    .eq('store_id', STORE_ID);
  if (vErr) { console.error('Verify error:', vErr.message); process.exit(1); }
  console.log(`   Supabase now has ${after.length} deliveries`);

  const vDates = {};
  after.forEach(d => { vDates[d.date] = (vDates[d.date] || 0) + 1; });
  console.log('   By date:', JSON.stringify(vDates));

  if (after.length >= allDeliveries.length) {
    console.log(`\n=== SUCCESS: ${after.length} deliveries in Supabase (Redis had ${allDeliveries.length}) ===`);
  } else {
    console.error(`\n=== WARNING: Supabase has ${after.length}, Redis had ${allDeliveries.length} ===`);
  }

  console.log('\nSamples:');
  after.slice(0, 5).forEach(d => console.log(`   ${d.delivery_id} | ${d.date} | ${d.name} | ${d.status}`));
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
