// api/_supabase.js — Shared Supabase client + feature flag
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}

// Feature flag: returns true if Supabase is the primary data store
export function useSupabase() {
  return process.env.USE_SUPABASE === 'true';
}
