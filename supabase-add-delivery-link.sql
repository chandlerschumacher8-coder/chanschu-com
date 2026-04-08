-- Add delivery link columns to orders table for two-way linking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS linked_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Scheduled';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;

-- Index for quick lookup by linked delivery
CREATE INDEX IF NOT EXISTS idx_orders_linked_delivery ON orders(store_id, linked_delivery_id) WHERE linked_delivery_id IS NOT NULL;
