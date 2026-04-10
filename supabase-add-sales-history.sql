-- sales_history_items: historical SmartTouch sales imported from cleaned CSV.
-- Line-item grain. Keyed by (store_id, smarttouch_line_id) for idempotent re-import.
-- NEVER bulk-delete this table. Always upsert by the unique key.

CREATE TABLE IF NOT EXISTS sales_history_items (
  id                      BIGSERIAL PRIMARY KEY,
  store_id                BIGINT NOT NULL REFERENCES stores(id),
  smarttouch_line_id      TEXT NOT NULL,
  invoice_number          TEXT,
  numeric_invoice_number  BIGINT,
  date                    DATE,
  ship_date               DATE,
  delivery_date           DATE,
  customer_smarttouch_id  TEXT,
  customer_name           TEXT,
  model_number            TEXT,
  sku                     TEXT,
  description             TEXT,
  brand                   TEXT,
  category                TEXT,
  department              TEXT,
  qty                     NUMERIC(10,2),
  unit_price              NUMERIC(12,2),
  ext_price               NUMERIC(12,2),
  product_cost            NUMERIC(12,2),
  invoice_total           NUMERIC(12,2),
  tax                     NUMERIC(12,2),
  tax_rate                NUMERIC(6,4),
  discount                NUMERIC(12,2),
  serial_number           TEXT,
  sales_rep               TEXT,
  sales_rep2              TEXT,
  commission_due          NUMERIC(12,2),
  commission_method       TEXT,
  status                  TEXT,
  returned                BOOLEAN DEFAULT FALSE,
  seq                     INTEGER,
  phone                   TEXT,
  zip                     TEXT,
  po_number               TEXT,
  delivery_instructions   TEXT,
  terms                   TEXT,
  imported_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sales_history_items_store_line_unique UNIQUE (store_id, smarttouch_line_id)
);

CREATE INDEX IF NOT EXISTS idx_shi_store         ON sales_history_items(store_id);
CREATE INDEX IF NOT EXISTS idx_shi_store_invoice ON sales_history_items(store_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_shi_store_date    ON sales_history_items(store_id, date);
CREATE INDEX IF NOT EXISTS idx_shi_customer      ON sales_history_items(store_id, customer_smarttouch_id);
