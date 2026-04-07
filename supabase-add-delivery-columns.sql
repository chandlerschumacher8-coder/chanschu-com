-- Add shipper copy and invoice link fields to deliveries table
-- Run in Supabase SQL Editor

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS shipper_notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS deliv_instructions TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sold_to JSONB;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS ship_to JSONB;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS clerk TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sale_date TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]';
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS order_subtotal NUMERIC(10,2);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS order_tax NUMERIC(10,2);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS order_total NUMERIC(10,2);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS order_payment TEXT;
