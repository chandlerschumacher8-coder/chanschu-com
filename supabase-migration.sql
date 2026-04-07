-- ============================================================
-- SUPABASE MIGRATION: Redis → Supabase for DC Appliance POS
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- DC Appliance = store_id 1
-- ============================================================

-- ── STORES ──────────────────────────────────────────────────
CREATE TABLE stores (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  subdomain     TEXT UNIQUE,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#c9973a',
  tagline       TEXT,
  tax_county    TEXT,
  tax_rate      NUMERIC(6,4) DEFAULT 0,
  store_hours   TEXT,
  invoice_message TEXT,
  delivery_terms  TEXT,
  rent_amount     NUMERIC(10,2),
  landlord_name   TEXT,
  credit_card_names TEXT,
  bank_names        TEXT,
  subscription_tier   TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed DC Appliance as store 1
INSERT INTO stores (id, name, subdomain, phone, city, state)
VALUES (1, 'Dodge City Appliance', 'dc-appliance', '(620) 371-6417', 'Dodge City', 'KS');

-- Reset sequence so next auto-id is 2
SELECT setval('stores_id_seq', 1);

-- ── COMPANIES ───────────────────────────────────────────────
CREATE TABLE companies (
  id          TEXT PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMPLOYEES ───────────────────────────────────────────────
CREATE TABLE employees (
  id              BIGSERIAL PRIMARY KEY,
  store_id        BIGINT NOT NULL REFERENCES stores(id),
  employee_id     TEXT,
  name            TEXT NOT NULL,
  pos_role        TEXT DEFAULT 'Sales',
  role            TEXT DEFAULT 'employee',
  pin             TEXT,
  password        TEXT,
  phone           TEXT,
  email           TEXT,
  tech            TEXT,
  commission_rate NUMERIC(5,2),
  wage            NUMERIC(8,2),
  active          BOOLEAN DEFAULT TRUE,
  permissions     JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_employees_store ON employees(store_id);
CREATE INDEX idx_employees_pin ON employees(store_id, pin);

-- ── SERVICE TECHS ───────────────────────────────────────────
CREATE TABLE service_techs (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  tech_id     TEXT,
  name        TEXT NOT NULL,
  tech        TEXT,
  password    TEXT,
  phone       TEXT,
  email       TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_techs_store ON service_techs(store_id);

-- ── CUSTOMERS ───────────────────────────────────────────────
CREATE TABLE customers (
  id              BIGSERIAL PRIMARY KEY,
  store_id        BIGINT NOT NULL REFERENCES stores(id),
  customer_num    TEXT,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  notes           TEXT,
  email_opt_out   BOOLEAN DEFAULT FALSE,
  appliance_history JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_store ON customers(store_id);
CREATE INDEX idx_customers_name ON customers(store_id, name);
CREATE INDEX idx_customers_phone ON customers(store_id, phone);

-- ── DEPARTMENTS ─────────────────────────────────────────────
CREATE TABLE departments (
  id        BIGSERIAL PRIMARY KEY,
  store_id  BIGINT NOT NULL REFERENCES stores(id),
  name      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_departments_store ON departments(store_id);

-- ── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
  id            BIGSERIAL PRIMARY KEY,
  store_id      BIGINT NOT NULL REFERENCES stores(id),
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE INDEX idx_categories_dept ON categories(department_id);

-- ── BRANDS ──────────────────────────────────────────────────
CREATE TABLE brands (
  id        BIGSERIAL PRIMARY KEY,
  store_id  BIGINT NOT NULL REFERENCES stores(id),
  name      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_brands_store ON brands(store_id);

-- ── VENDORS ─────────────────────────────────────────────────
CREATE TABLE vendors (
  id            BIGSERIAL PRIMARY KEY,
  store_id      BIGINT NOT NULL REFERENCES stores(id),
  name          TEXT NOT NULL,
  rep_name      TEXT,
  phone         TEXT,
  email         TEXT,
  account_num   TEXT,
  payment_terms TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vendors_store ON vendors(store_id);

-- ── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
  id              BIGSERIAL PRIMARY KEY,
  store_id        BIGINT NOT NULL REFERENCES stores(id),
  sku             TEXT,
  upc             TEXT,
  model           TEXT,
  name            TEXT NOT NULL,
  brand           TEXT,
  category        TEXT,
  vendor          TEXT,
  icon            TEXT,
  price           NUMERIC(10,2) DEFAULT 0,
  cost            NUMERIC(10,2) DEFAULT 0,
  stock           INTEGER DEFAULT 0,
  sold            INTEGER DEFAULT 0,
  reorder_pt      INTEGER DEFAULT 0,
  reorder_qty     INTEGER DEFAULT 0,
  sales_30        INTEGER DEFAULT 0,
  warranty        TEXT,
  serial          TEXT,
  serial_tracked  BOOLEAN DEFAULT FALSE,
  price_locked    BOOLEAN DEFAULT FALSE,
  needs_pricing   BOOLEAN DEFAULT FALSE,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_model ON products(store_id, model);
CREATE INDEX idx_products_upc ON products(store_id, upc);
CREATE INDEX idx_products_brand ON products(store_id, brand);
CREATE INDEX idx_products_category ON products(store_id, category);

-- ── SERIAL POOL ─────────────────────────────────────────────
CREATE TABLE serial_pool (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sn          TEXT NOT NULL,
  status      TEXT DEFAULT 'available',
  assigned_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  vendor      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_serial_pool_store ON serial_pool(store_id);
CREATE INDEX idx_serial_pool_product ON serial_pool(product_id);
CREATE INDEX idx_serial_pool_sn ON serial_pool(store_id, sn);

-- ── ORDERS ──────────────────────────────────────────────────
CREATE TABLE orders (
  id              BIGSERIAL PRIMARY KEY,
  store_id        BIGINT NOT NULL REFERENCES stores(id),
  order_id        TEXT NOT NULL,
  customer        TEXT,
  subtotal        NUMERIC(10,2) DEFAULT 0,
  tax             NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(10,2) DEFAULT 0,
  tax_zone        TEXT,
  payment         TEXT,
  status          TEXT DEFAULT 'Awaiting Delivery',
  date            TIMESTAMPTZ DEFAULT NOW(),
  invoice_notes   TEXT,
  shipper_notes   TEXT,
  sold_to         JSONB,
  ship_to         JSONB,
  clerk           TEXT,
  po              TEXT,
  job             TEXT,
  notes           TEXT,
  address         TEXT,
  delivery_date   DATE,
  delivery_time   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_order_id ON orders(store_id, order_id);
CREATE INDEX idx_orders_customer ON orders(store_id, customer);
CREATE INDEX idx_orders_status ON orders(store_id, status);
CREATE INDEX idx_orders_date ON orders(store_id, date);

-- ── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE order_items (
  id                BIGSERIAL PRIMARY KEY,
  store_id          BIGINT NOT NULL REFERENCES stores(id),
  order_id          BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        BIGINT REFERENCES products(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  model             TEXT,
  price             NUMERIC(10,2) DEFAULT 0,
  qty               INTEGER DEFAULT 1,
  serial            TEXT,
  discount          NUMERIC(10,2) DEFAULT 0,
  discount_pct      NUMERIC(5,2) DEFAULT 0,
  orig_price        NUMERIC(10,2),
  serial_tracked    BOOLEAN DEFAULT FALSE,
  price_matched     BOOLEAN DEFAULT FALSE,
  price_match_info  JSONB,
  is_service        BOOLEAN DEFAULT FALSE,
  commission_rate   NUMERIC(5,2),
  commission_earned NUMERIC(10,2),
  delivered         BOOLEAN DEFAULT FALSE,
  delivered_at      TIMESTAMPTZ,
  delivered_by      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_store ON order_items(store_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── DELIVERIES ──────────────────────────────────────────────
CREATE TABLE deliveries (
  id              BIGSERIAL PRIMARY KEY,
  store_id        BIGINT NOT NULL REFERENCES stores(id),
  delivery_id     TEXT NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  invoice         TEXT,
  notes           TEXT,
  date            DATE NOT NULL,
  time            TEXT,
  duration        TEXT,
  team            TEXT,
  stop_order      INTEGER,
  delivery_type   TEXT DEFAULT 'Full Install',
  status          TEXT DEFAULT 'Scheduled',
  appliances      JSONB DEFAULT '[]',
  invoice_files   JSONB DEFAULT '[]',
  photos          JSONB DEFAULT '[]',
  email_log       JSONB DEFAULT '[]',
  log             JSONB DEFAULT '[]',
  linked_order_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deliveries_store ON deliveries(store_id);
CREATE INDEX idx_deliveries_date ON deliveries(store_id, date);
CREATE INDEX idx_deliveries_status ON deliveries(store_id, status);
CREATE INDEX idx_deliveries_delivery_id ON deliveries(store_id, delivery_id);

-- ── DELIVERY NOTES (calendar notes) ────────────────────────
CREATE TABLE delivery_notes (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  note_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  all_day     BOOLEAN DEFAULT FALSE,
  time        TEXT,
  duration    TEXT,
  details     TEXT,
  color       TEXT DEFAULT 'blue',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_delivery_notes_store ON delivery_notes(store_id);
CREATE INDEX idx_delivery_notes_date ON delivery_notes(store_id, date);

-- ── SERVICE JOBS ────────────────────────────────────────────
CREATE TABLE service_jobs (
  id                  BIGSERIAL PRIMARY KEY,
  store_id            BIGINT NOT NULL REFERENCES stores(id),
  job_id              TEXT NOT NULL,
  name                TEXT NOT NULL,
  phone               TEXT,
  email               TEXT,
  address             TEXT,
  city                TEXT,
  appliance           TEXT,
  brand               TEXT,
  model               TEXT,
  serial              TEXT,
  warranty            TEXT,
  invoice             TEXT,
  claim               TEXT,
  delivery            TEXT,
  issue               TEXT,
  date                DATE,
  time                TEXT,
  tech                TEXT,
  priority            TEXT DEFAULT 'Normal',
  notes               TEXT,
  status              TEXT DEFAULT 'Open',
  part_on_order       BOOLEAN DEFAULT FALSE,
  part_number         TEXT,
  customer_contacted  BOOLEAN DEFAULT FALSE,
  activity_log        JSONB DEFAULT '[]',
  files               JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_service_jobs_store ON service_jobs(store_id);
CREATE INDEX idx_service_jobs_status ON service_jobs(store_id, status);
CREATE INDEX idx_service_jobs_tech ON service_jobs(store_id, tech);
CREATE INDEX idx_service_jobs_date ON service_jobs(store_id, date);
CREATE INDEX idx_service_jobs_job_id ON service_jobs(store_id, job_id);

-- ── PURCHASE ORDERS ─────────────────────────────────────────
CREATE TABLE purchase_orders (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  po_number   TEXT NOT NULL,
  vendor      TEXT,
  status      TEXT DEFAULT 'Draft',
  notes       TEXT,
  total       NUMERIC(10,2) DEFAULT 0,
  ordered_at  TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_po_store ON purchase_orders(store_id);

-- ── PURCHASE ORDER ITEMS ────────────────────────────────────
CREATE TABLE purchase_order_items (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  po_id       BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id  BIGINT REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT,
  model       TEXT,
  qty         INTEGER DEFAULT 1,
  cost        NUMERIC(10,2) DEFAULT 0,
  received    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_po_items_store ON purchase_order_items(store_id);
CREATE INDEX idx_po_items_po ON purchase_order_items(po_id);

-- ── TIME CLOCK ──────────────────────────────────────────────
CREATE TABLE time_clock (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  punch_id    TEXT,
  employee    TEXT NOT NULL,
  date        DATE NOT NULL,
  clock_in    TIMESTAMPTZ NOT NULL,
  clock_out   TIMESTAMPTZ,
  type        TEXT DEFAULT 'regular',
  hours       NUMERIC(6,2),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_time_clock_store ON time_clock(store_id);
CREATE INDEX idx_time_clock_employee ON time_clock(store_id, employee);
CREATE INDEX idx_time_clock_date ON time_clock(store_id, date);

-- ── SESSIONS ────────────────────────────────────────────────
CREATE TABLE sessions (
  id              BIGSERIAL PRIMARY KEY,
  store_id        BIGINT REFERENCES stores(id),
  token           TEXT NOT NULL UNIQUE,
  employee_id     TEXT,
  employee_name   TEXT,
  company_id      TEXT,
  auth_type       TEXT DEFAULT 'employee',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ── COUNTERS (for ID generation like DEL-0001, JOB-0001) ───
CREATE TABLE counters (
  id        BIGSERIAL PRIMARY KEY,
  store_id  BIGINT NOT NULL REFERENCES stores(id),
  key       TEXT NOT NULL,
  value     INTEGER DEFAULT 0,
  UNIQUE(store_id, key)
);

-- Seed initial counters for DC Appliance
-- These will be updated during migration with actual values
INSERT INTO counters (store_id, key, value) VALUES
  (1, 'next_delivery_id', 1),
  (1, 'next_note_id', 1),
  (1, 'next_order_id', 1),
  (1, 'next_quote_id', 1),
  (1, 'next_job_id', 1);

-- ── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'stores','companies','employees','service_techs','customers',
    'vendors','products','orders','deliveries','delivery_notes',
    'service_jobs','purchase_orders','time_clock'
  ])
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END;
$$;

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
-- Enable RLS on all tables (service_role key bypasses RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_techs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- Service role (used by API) bypasses RLS automatically.
-- No anon policies needed — all access is server-mediated.

-- ============================================================
-- MIGRATION COMPLETE
-- Next: Run the migration script to move data from Redis
-- ============================================================
