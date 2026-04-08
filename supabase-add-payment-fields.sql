-- Add payment tracking fields for per-invoice ledger (Bug #18)
-- Run this before go-live

-- Customer payments already stored in JSONB (c.payments[])
-- These fields ensure order_id is tracked on every payment entry

-- Orders: ensure payments JSONB column exists (should already)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;

-- Note: payment_details column was added in supabase-add-missing-columns.sql
-- No additional schema changes needed — payment orderId is stored inside the JSONB
