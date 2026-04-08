-- Add soft delete columns to all protected tables
-- Run this BEFORE using the Clear Data functions

-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(store_id, deleted) WHERE deleted = false;

-- Serial Pool
ALTER TABLE serial_pool ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE serial_pool ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_orders_deleted ON orders(store_id, deleted) WHERE deleted = false;

-- Add unique constraint on (store_id, order_id) for upsert support
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_store_id_order_id_key'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_store_id_order_id_key UNIQUE (store_id, order_id);
  END IF;
END $$;

-- Order Items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(store_id, deleted) WHERE deleted = false;
