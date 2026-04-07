#!/usr/bin/env node
// ============================================================
// MIGRATION SCRIPT: Redis → Supabase
// Run locally: node migrate-redis-to-supabase.js
//
// Required env vars (set in shell or .env):
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//
// IMPORTANT: Run supabase-migration.sql FIRST to create tables.
// ============================================================

import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

const redis = Redis.fromEnv();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORE_ID = 1; // DC Appliance

// Helper: parse Redis value (may already be object from Upstash)
function parse(raw) {
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// Helper: safe timestamp
function ts(val) {
  if (!val) return null;
  try { return new Date(val).toISOString(); } catch { return null; }
}

// Helper: safe date
function safeDate(val) {
  if (!val) return null;
  // Handle "YYYY-MM-DD" format
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try { return new Date(val).toISOString().split('T')[0]; } catch { return null; }
}

async function migrateEmployees() {
  console.log('\n── EMPLOYEES ──');
  const raw = parse(await redis.get('users:dc-appliance'));
  if (!raw || !Array.isArray(raw)) { console.log('  No employees found'); return 0; }

  const rows = raw.map(u => ({
    store_id: STORE_ID,
    employee_id: u.id || null,
    name: u.name || 'Unknown',
    pos_role: u.posRole || 'Sales',
    role: u.role || 'employee',
    pin: u.pin || null,
    password: u.password || null,
    phone: u.phone || null,
    email: u.email || null,
    tech: u.tech || null,
    commission_rate: u.commissionRate || null,
    wage: u.wage || null,
    active: u.active !== false,
    permissions: u.permissions || [],
  }));

  const { error } = await supabase.from('employees').insert(rows);
  if (error) throw new Error('employees insert: ' + error.message);
  console.log(`  ✓ ${rows.length} employees migrated`);
  return rows.length;
}

async function migrateServiceTechs() {
  console.log('\n── SERVICE TECHS ──');
  const raw = parse(await redis.get('service:techs'));
  if (!raw || !Array.isArray(raw)) { console.log('  No techs found'); return 0; }

  const rows = raw.map(t => ({
    store_id: STORE_ID,
    tech_id: t.id || null,
    name: t.name || 'Unknown',
    tech: t.tech || null,
    password: t.password || null,
    phone: t.phone || null,
    email: t.email || null,
    active: t.active !== false,
  }));

  const { error } = await supabase.from('service_techs').insert(rows);
  if (error) throw new Error('service_techs insert: ' + error.message);
  console.log(`  ✓ ${rows.length} techs migrated`);
  return rows.length;
}

async function migrateCompanies() {
  console.log('\n── COMPANIES ──');
  const raw = parse(await redis.get('companies'));
  if (!raw || !Array.isArray(raw)) { console.log('  No companies found'); return 0; }

  const rows = raw.map(c => ({
    id: c.id,
    store_id: STORE_ID,
    name: c.name || c.id,
    address: c.address || null,
    phone: c.phone || null,
    email: c.email || null,
  }));

  const { error } = await supabase.from('companies').insert(rows);
  if (error) throw new Error('companies insert: ' + error.message);
  console.log(`  ✓ ${rows.length} companies migrated`);
  return rows.length;
}

async function migrateCustomers() {
  console.log('\n── CUSTOMERS ──');
  const raw = parse(await redis.get('pos:customers'));
  if (!raw || !Array.isArray(raw)) { console.log('  No customers found'); return 0; }

  // Insert in batches of 50
  let total = 0;
  for (let i = 0; i < raw.length; i += 50) {
    const batch = raw.slice(i, i + 50).map(c => ({
      store_id: STORE_ID,
      customer_num: c.customerNum || null,
      name: c.name || 'Unknown',
      phone: c.phone || null,
      email: c.email || null,
      address: c.address || null,
      city: c.city || null,
      state: c.state || null,
      zip: c.zip || null,
      notes: c.notes || null,
      email_opt_out: c.emailOptOut || false,
      appliance_history: c.applianceHistory || [],
    }));

    const { error } = await supabase.from('customers').insert(batch);
    if (error) throw new Error('customers insert batch ' + i + ': ' + error.message);
    total += batch.length;
    if (i % 500 === 0 && i > 0) console.log(`    ... ${total} so far`);
  }
  console.log(`  ✓ ${total} customers migrated`);
  return total;
}

async function migrateOrders() {
  console.log('\n── ORDERS ──');
  const raw = parse(await redis.get('pos:orders'));
  if (!raw) { console.log('  No orders data found'); return { orders: 0, items: 0 }; }

  const orderList = raw.orders || [];
  if (!orderList.length) { console.log('  No orders to migrate'); return { orders: 0, items: 0 }; }

  let orderCount = 0;
  let itemCount = 0;

  // Insert orders one at a time to get back IDs for items
  for (const o of orderList) {
    const orderRow = {
      store_id: STORE_ID,
      order_id: o.id || 'ORD-0000',
      customer: o.customer || null,
      subtotal: o.subtotal || 0,
      tax: o.tax || 0,
      total: o.total || 0,
      tax_zone: o.taxZone || null,
      payment: o.payment || null,
      status: o.status || 'Awaiting Delivery',
      date: ts(o.date) || new Date().toISOString(),
      invoice_notes: o.invoiceNotes || null,
      shipper_notes: o.shipperNotes || null,
      sold_to: o.soldTo || null,
      ship_to: o.shipTo || null,
      clerk: o.clerk || null,
      po: o.po || null,
      job: o.job || null,
      notes: o.notes || null,
      address: o.address || null,
      delivery_date: safeDate(o.deliveryDate),
      delivery_time: o.deliveryTime || null,
    };

    const { data: inserted, error } = await supabase
      .from('orders')
      .insert(orderRow)
      .select('id')
      .single();
    if (error) { console.error('  ✗ Order ' + o.id + ': ' + error.message); continue; }
    orderCount++;

    // Insert order items
    const items = o.items || [];
    if (items.length) {
      const itemRows = items.map(it => ({
        store_id: STORE_ID,
        order_id: inserted.id,
        name: it.name || 'Item',
        model: it.model || null,
        price: it.price || 0,
        qty: it.qty || 1,
        serial: it.serial || null,
        discount: it.discount || 0,
        discount_pct: it.discountPct || 0,
        orig_price: it.origPrice || null,
        serial_tracked: it.serialTracked || false,
        price_matched: it.priceMatched || false,
        price_match_info: it.priceMatchInfo || null,
        is_service: it.isService || false,
        commission_rate: it.commissionRate || null,
        commission_earned: it.commissionEarned || null,
        delivered: it.delivered || false,
        delivered_at: ts(it.deliveredAt),
        delivered_by: it.deliveredBy || null,
      }));

      const { error: itemError } = await supabase.from('order_items').insert(itemRows);
      if (itemError) console.error('  ✗ Items for ' + o.id + ': ' + itemError.message);
      else itemCount += itemRows.length;
    }
  }

  // Update counters
  const nextOrderId = raw.nextOrderId || orderList.length + 1;
  const nextQuoteId = raw.nextQuoteId || 1;
  await supabase.from('counters').update({ value: nextOrderId }).match({ store_id: STORE_ID, key: 'next_order_id' });
  await supabase.from('counters').update({ value: nextQuoteId }).match({ store_id: STORE_ID, key: 'next_quote_id' });

  console.log(`  ✓ ${orderCount} orders, ${itemCount} items migrated`);
  return { orders: orderCount, items: itemCount };
}

async function migrateDeliveries() {
  console.log('\n── DELIVERIES ──');
  const raw = parse(await redis.get('dc-deliveries'));
  if (!raw) { console.log('  No deliveries data found'); return { deliveries: 0, notes: 0 }; }

  const delList = raw.deliveries || [];
  const noteList = raw.notes || [];

  if (delList.length) {
    // Insert in batches of 100
    let delCount = 0;
    for (let i = 0; i < delList.length; i += 100) {
      const batch = delList.slice(i, i + 100).map(d => ({
        store_id: STORE_ID,
        delivery_id: d.id || 'DEL-0000',
        name: d.name || 'Unknown',
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        city: d.city || null,
        invoice: d.invoice || null,
        notes: d.notes || null,
        date: safeDate(d.date) || new Date().toISOString().split('T')[0],
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
        created_at: ts(d.createdAt) || new Date().toISOString(),
        delivered_at: ts(d.deliveredAt),
      }));

      const { error } = await supabase.from('deliveries').insert(batch);
      if (error) throw new Error('deliveries insert batch ' + i + ': ' + error.message);
      delCount += batch.length;
    }
    console.log(`  ✓ ${delCount} deliveries migrated`);
  }

  if (noteList.length) {
    const noteRows = noteList.map(n => ({
      store_id: STORE_ID,
      note_id: n.id || 'NOTE-000',
      title: n.title || 'Note',
      date: safeDate(n.date) || new Date().toISOString().split('T')[0],
      all_day: n.allDay || false,
      time: n.time || null,
      duration: n.duration || null,
      details: n.details || null,
      color: n.color || 'blue',
      created_at: ts(n.createdAt) || new Date().toISOString(),
    }));

    const { error } = await supabase.from('delivery_notes').insert(noteRows);
    if (error) throw new Error('delivery_notes insert: ' + error.message);
    console.log(`  ✓ ${noteRows.length} delivery notes migrated`);
  }

  // Update counters
  await supabase.from('counters').update({ value: raw.nextId || delList.length + 1 }).match({ store_id: STORE_ID, key: 'next_delivery_id' });
  await supabase.from('counters').update({ value: raw.nextNoteId || noteList.length + 1 }).match({ store_id: STORE_ID, key: 'next_note_id' });

  return { deliveries: delList.length, notes: noteList.length };
}

async function migrateServiceJobs() {
  console.log('\n── SERVICE JOBS ──');

  // Migrate both dc-service-jobs and jobs:dc-appliance
  const dcRaw = parse(await redis.get('dc-service-jobs'));
  const genRaw = parse(await redis.get('jobs:dc-appliance'));

  // Combine — dc-service-jobs is the primary, jobs:dc-appliance may have older data
  const dcJobs = dcRaw ? (dcRaw.jobs || []) : [];
  const genJobs = genRaw ? (genRaw.jobs || []) : [];

  // Deduplicate by job ID
  const seen = new Set();
  const allJobs = [];
  for (const j of [...dcJobs, ...genJobs]) {
    if (j.id && !seen.has(j.id)) { seen.add(j.id); allJobs.push(j); }
  }

  if (!allJobs.length) { console.log('  No service jobs found'); return 0; }

  const rows = allJobs.map(j => ({
    store_id: STORE_ID,
    job_id: j.id || 'JOB-0000',
    name: j.name || 'Unknown',
    phone: j.phone || null,
    email: j.email || null,
    address: j.address || null,
    city: j.city || null,
    appliance: j.appliance || null,
    brand: j.brand || null,
    model: j.model || null,
    serial: j.serial || null,
    warranty: j.warranty || null,
    invoice: j.invoice || null,
    claim: j.claim || null,
    delivery: j.delivery || null,
    issue: j.issue || null,
    date: safeDate(j.date),
    time: j.time || null,
    tech: j.tech || null,
    priority: j.priority || 'Normal',
    notes: j.notes || null,
    status: j.status || 'Open',
    part_on_order: j.partOnOrder || false,
    part_number: j.partNumber || null,
    customer_contacted: j.customerContacted || false,
    activity_log: j.activityLog || [],
    files: j.files || [],
    created_at: ts(j.createdAt) || new Date().toISOString(),
    completed_at: ts(j.completedAt),
  }));

  // Insert in batches
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from('service_jobs').insert(batch);
    if (error) throw new Error('service_jobs insert batch ' + i + ': ' + error.message);
  }

  // Update counter
  const maxId = Math.max(
    dcRaw?.nextId || 0,
    genRaw?.nextId || 0,
    allJobs.length + 1
  );
  await supabase.from('counters').update({ value: maxId }).match({ store_id: STORE_ID, key: 'next_job_id' });

  console.log(`  ✓ ${rows.length} service jobs migrated`);
  return rows.length;
}

async function migrateTimeClock() {
  console.log('\n── TIME CLOCK ──');
  const raw = parse(await redis.get('pos:timeclock-punches'));
  if (!raw || !Array.isArray(raw)) { console.log('  No time clock data found'); return 0; }

  // Insert in batches of 500
  let total = 0;
  for (let i = 0; i < raw.length; i += 500) {
    const batch = raw.slice(i, i + 500).map(p => ({
      store_id: STORE_ID,
      punch_id: p.id || null,
      employee: p.employee || 'Unknown',
      date: safeDate(p.date) || new Date().toISOString().split('T')[0],
      clock_in: ts(p.clockIn) || new Date().toISOString(),
      clock_out: ts(p.clockOut),
      type: p.type || 'regular',
      hours: p.hours || null,
    }));

    const { error } = await supabase.from('time_clock').insert(batch);
    if (error) throw new Error('time_clock insert batch ' + i + ': ' + error.message);
    total += batch.length;
  }
  console.log(`  ✓ ${total} time clock punches migrated`);
  return total;
}

async function migrateProducts() {
  console.log('\n── PRODUCTS ──');
  const raw = parse(await redis.get('pos:products'));
  if (!raw || !Array.isArray(raw)) { console.log('  No products found'); return { products: 0, serials: 0 }; }

  let productCount = 0;
  let serialCount = 0;

  // Insert products in batches, then serial pools
  for (let i = 0; i < raw.length; i += 50) {
    const batch = raw.slice(i, i + 50);
    const productRows = batch.map(p => ({
      store_id: STORE_ID,
      sku: p.sku || null,
      upc: p.upc || null,
      model: p.model || null,
      name: p.name || 'Product',
      brand: p.brand || null,
      category: p.cat || null,
      vendor: p.vendor || null,
      icon: p.icon || null,
      price: p.price || 0,
      cost: p.cost || 0,
      stock: p.stock || 0,
      sold: p.sold || 0,
      reorder_pt: p.reorderPt || 0,
      reorder_qty: p.reorderQty || 0,
      sales_30: p.sales30 || 0,
      warranty: p.warranty || null,
      serial: p.serial || null,
      serial_tracked: p.serialTracked || false,
      price_locked: p.priceLocked || false,
      needs_pricing: p.needsPricing || false,
      active: p.active !== false,
    }));

    const { data: inserted, error } = await supabase.from('products').insert(productRows).select('id');
    if (error) { console.error('  ✗ Products batch ' + i + ': ' + error.message); continue; }
    productCount += inserted.length;
    if (i % 250 === 0 && i > 0) console.log(`    ... ${productCount} products so far`);

    // Migrate serial pools for products that have them
    for (let j = 0; j < batch.length; j++) {
      const p = batch[j];
      const productDbId = inserted[j]?.id;
      if (p.serialPool && Array.isArray(p.serialPool) && p.serialPool.length && productDbId) {
        const serialRows = p.serialPool.map(s => ({
          store_id: STORE_ID,
          product_id: productDbId,
          sn: s.sn || '',
          status: s.status || 'available',
          assigned_at: ts(s.assignedAt),
          received_at: ts(s.receivedAt),
          vendor: s.vendor || null,
        }));
        const { error: sErr } = await supabase.from('serial_pool').insert(serialRows);
        if (sErr) console.error('  ✗ Serials for product ' + productDbId + ': ' + sErr.message);
        else serialCount += serialRows.length;
      }
    }
  }
  console.log(`  ✓ ${productCount} products, ${serialCount} serial pool entries migrated`);
  return { products: productCount, serials: serialCount };
}

async function migrateBrandsVendorsDepartments() {
  console.log('\n── BRANDS / VENDORS / DEPARTMENTS / CATEGORIES ──');

  // Brands — key is pos:admin-brands (array of strings)
  if (!(await hasData('brands'))) {
    const brandsRaw = parse(await redis.get('pos:admin-brands'));
    if (brandsRaw && Array.isArray(brandsRaw) && brandsRaw.length) {
      const brandRows = brandsRaw.map(b => ({
        store_id: STORE_ID,
        name: typeof b === 'string' ? b : b.name || 'Unknown',
      }));
      const { error } = await supabase.from('brands').insert(brandRows);
      if (error) console.error('  ✗ Brands: ' + error.message);
      else console.log(`  ✓ ${brandRows.length} brands migrated`);
    } else { console.log('  No brands found'); }
  } else { console.log('  Brands already migrated, skipping'); }

  // Vendors — key is pos:admin-vendors
  if (!(await hasData('vendors'))) {
    const vendorsRaw = parse(await redis.get('pos:admin-vendors'));
    if (vendorsRaw && Array.isArray(vendorsRaw) && vendorsRaw.length) {
      const vendorRows = vendorsRaw.map(v => ({
        store_id: STORE_ID,
        name: v.name || 'Unknown',
        rep_name: v.repName || null,
        phone: v.phone || null,
        email: v.email || null,
        account_num: v.accountNum || null,
        payment_terms: v.paymentTerms || null,
      }));
      const { error } = await supabase.from('vendors').insert(vendorRows);
      if (error) console.error('  ✗ Vendors: ' + error.message);
      else console.log(`  ✓ ${vendorRows.length} vendors migrated`);
    } else { console.log('  No vendors found'); }
  } else { console.log('  Vendors already migrated, skipping'); }

  // Categories — key is pos:admin-categories (flat array: [{name, dept}])
  // Group by dept to create departments, then insert categories under each
  if (!(await hasData('departments'))) {
    const catsRaw = parse(await redis.get('pos:admin-categories'));
    if (catsRaw && Array.isArray(catsRaw) && catsRaw.length) {
      // Group categories by department name
      const deptMap = {};
      catsRaw.forEach(c => {
        const deptName = c.dept || 'Uncategorized';
        if (!deptMap[deptName]) deptMap[deptName] = [];
        deptMap[deptName].push(c.name || 'Unknown');
      });

      let deptCount = 0, catCount = 0;
      for (const [deptName, catNames] of Object.entries(deptMap)) {
        const { data: deptRow, error: dErr } = await supabase
          .from('departments')
          .insert({ store_id: STORE_ID, name: deptName })
          .select('id')
          .single();
        if (dErr) { console.error('  ✗ Department ' + deptName + ': ' + dErr.message); continue; }
        deptCount++;

        if (catNames.length) {
          const catRows = catNames.map(name => ({
            store_id: STORE_ID,
            department_id: deptRow.id,
            name,
          }));
          const { error: cErr } = await supabase.from('categories').insert(catRows);
          if (cErr) console.error('  ✗ Categories for ' + deptName + ': ' + cErr.message);
          else catCount += catRows.length;
        }
      }
      console.log(`  ✓ ${deptCount} departments, ${catCount} categories migrated`);
    } else { console.log('  No categories/departments found'); }
  } else { console.log('  Departments/categories already migrated, skipping'); }
}

// ── VERIFICATION ──
async function verify() {
  console.log('\n══════════════════════════════════════');
  console.log('  VERIFICATION');
  console.log('══════════════════════════════════════');

  const tables = [
    'employees', 'service_techs', 'companies', 'customers',
    'orders', 'order_items', 'deliveries', 'delivery_notes',
    'service_jobs', 'time_clock', 'products', 'serial_pool',
    'brands', 'vendors', 'departments', 'categories',
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('store_id', STORE_ID);
    console.log(`  ${table}: ${error ? 'ERROR - ' + error.message : count + ' rows'}`);
  }

  // Check counters
  const { data: counters } = await supabase
    .from('counters')
    .select('key, value')
    .eq('store_id', STORE_ID);
  console.log('\n  Counters:');
  (counters || []).forEach(c => console.log(`    ${c.key} = ${c.value}`));
}

// Helper: check if a table already has data for this store
async function hasData(table) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('store_id', STORE_ID);
  return count > 0;
}

// ── MAIN ──
async function main() {
  console.log('══════════════════════════════════════');
  console.log('  REDIS → SUPABASE MIGRATION');
  console.log('  Store: DC Appliance (store_id = 1)');
  console.log('══════════════════════════════════════');
  console.log('  Supabase:', process.env.SUPABASE_URL);
  console.log('  Starting migration (skips tables with existing data)...\n');

  try {
    if (await hasData('companies')) console.log('── COMPANIES ── already migrated, skipping');
    else await migrateCompanies();

    if (await hasData('employees')) console.log('── EMPLOYEES ── already migrated, skipping');
    else await migrateEmployees();

    if (await hasData('service_techs')) console.log('── SERVICE TECHS ── already migrated, skipping');
    else await migrateServiceTechs();

    if (await hasData('customers')) console.log('── CUSTOMERS ── already migrated, skipping');
    else await migrateCustomers();

    if (await hasData('products')) console.log('── PRODUCTS ── already migrated, skipping');
    else await migrateProducts();

    await migrateBrandsVendorsDepartments();

    if (await hasData('orders')) console.log('── ORDERS ── already migrated, skipping');
    else await migrateOrders();

    if (await hasData('deliveries')) console.log('── DELIVERIES ── already migrated, skipping');
    else await migrateDeliveries();

    if (await hasData('service_jobs')) console.log('── SERVICE JOBS ── already migrated, skipping');
    else await migrateServiceJobs();

    if (await hasData('time_clock')) console.log('── TIME CLOCK ── already migrated, skipping');
    else await migrateTimeClock();

    await verify();

    console.log('\n══════════════════════════════════════');
    console.log('  ✓ MIGRATION COMPLETE');
    console.log('  Redis data is preserved as backup.');
    console.log('  Set USE_SUPABASE=true in Vercel to switch.');
    console.log('══════════════════════════════════════\n');
  } catch (err) {
    console.error('\n  ✗ MIGRATION FAILED:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
