// Migrate generic config keys from Redis to Supabase store_config table
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

const redis = Redis.fromEnv();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const STORE_ID = 1;

function parse(raw) {
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

const CONFIG_KEYS = [
  'admin-commissions',
  'admin-tax-zones',
  'pos-settings',
  'hot-buttons',
  'commission-rates',
  'quotes',
  'merge-history',
  'data-clear-log',
  'sales-import-history',
  'serial-import-history',
  'admin-users',
];

async function main() {
  console.log('Migrating config keys from Redis to Supabase store_config...\n');

  for (const key of CONFIG_KEYS) {
    const raw = parse(await redis.get('pos:' + key));
    if (raw === null) {
      console.log(`  ${key}: no data in Redis, skipping`);
      continue;
    }
    const { error } = await supabase.from('store_config').upsert(
      { store_id: STORE_ID, key, data: raw },
      { onConflict: 'store_id,key' }
    );
    if (error) {
      console.log(`  ${key}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${key}: migrated`);
    }
  }

  // Also migrate stores data
  const storesRaw = parse(await redis.get('pos:stores'));
  if (storesRaw && Array.isArray(storesRaw) && storesRaw[0]) {
    const s = storesRaw[0];
    const { error } = await supabase.from('stores').update({
      name: s.store_name || s.name || 'DC Appliance',
      subdomain: s.subdomain || null,
      address: s.address || null, city: s.city || null,
      state: s.state || null, zip: s.zip || null,
      phone: s.phone || null, email: s.email || null,
      logo_url: s.logo_url || null, primary_color: s.primary_color || null,
      tagline: s.tagline || null, tax_county: s.tax_county || null,
      tax_rate: s.tax_rate || null, store_hours: s.store_hours || null,
      invoice_message: s.invoice_message || null, delivery_terms: s.delivery_terms || null,
      rent_amount: s.rent_amount || null, landlord_name: s.landlord_name || null,
      credit_card_names: s.credit_card_names || null, bank_names: s.bank_names || null,
    }).eq('id', STORE_ID);
    if (error) console.log(`  stores: ERROR - ${error.message}`);
    else console.log('  stores: migrated to stores table');
  }

  console.log('\nDone.');
}

main();
