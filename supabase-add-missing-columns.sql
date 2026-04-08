-- Add missing columns identified in go-live diagnostic
-- Run this migration before go-live

-- Order items: add product_id and warranty_status
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id BIGINT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS warranty_status TEXT;

-- Orders: add email_log and payment_details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Customers: add missing profile fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cell TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fax TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ar_num TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cid TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_class TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_level TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS flags JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS demographics JSONB;
