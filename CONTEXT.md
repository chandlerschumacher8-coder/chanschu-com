# CONTEXT.md — Appliance OS / DC Appliance POS

> This file documents the entire codebase so any new Claude Code session can get up to speed instantly.

---

## PROJECT OVERVIEW

- **Project name:** Appliance OS / DC Appliance POS
- **Live URL:** https://chanschu.com/pos.htm
- **GitHub:** chandlerschumacher8-coder/chanschu-com
- **Hosting:** Vercel (Fluid Compute, serverless API functions)
- **Purpose:** Full POS system for DC Appliance, Dodge City KS. Being built as a SaaS product (Appliance OS) to sell to other appliance stores.

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Plain HTML/CSS/JavaScript (no framework) |
| Database | Supabase (primary — `store_id = 1` for DC Appliance) |
| Cache | Upstash Redis (caching only, NOT for sessions or auth) |
| File Storage | Vercel Blob (photos, invoices, backups) |
| AI | Anthropic Claude API via `/api/ai-chat` proxy |
| Email | EmailJS (service: `service_gx9g5vj`, template: `template_0eo26t5`, public key: `8rsxIaKLiiRqq5Yo0`) |
| Hosting | Vercel — serverless functions in `/api/` |

---

## MAIN FILES

### Frontend Pages
| File | Purpose |
|------|---------|
| `pos.htm` | Main POS system — Dashboard, New Sale, Inventory, Open Orders, Delivery tab, Service tab, Customers, Time Clock, Admin |
| `delivery.html` | Standalone delivery schedule (used by delivery team on tablets/mobile) |
| `service.html` | Standalone service portal (used by contractor techs Jeff/Justin) |
| `dc-service.html` | DC Appliance service portal (legacy, uses same APIs as service.html) |

### JavaScript Modules (loaded by pos.htm)
| File | Purpose |
|------|---------|
| `pos-inventory.js` | Inventory management, delivery tab, service tab, order detail, product card, bulk edit, serial pool, purchase orders, receiving |
| `pos-admin.js` | Admin panel — categories, brands, vendors, commissions, tax zones, users, reports, data import, AR, warranties, AI usage, system status, error log, backups |
| `pos-dashboard.js` | Dashboard rendering, AI report generation |
| `pos-customers.js` | Customer list, profile, ledger, quick-add from sale, CSV import |
| `pos-timeclock.js` | Time clock punch in/out, daily summary |

### API Endpoints (`/api/`)
| Endpoint | Purpose |
|----------|---------|
| `_auth.js` | Session validation (reads from Supabase `sessions` table) |
| `_supabase.js` | Shared Supabase client + `useSupabase()` feature flag |
| `session-create.js` | Login — creates session in Supabase |
| `session-delete.js` | Logout — deletes session |
| `session-rotate.js` | Token rotation (every 4 hours) |
| `admin-get.js` | GET any data key (products, orders, customers, config) |
| `admin-save.js` | POST save any data key |
| `admin-clear.js` | Soft delete for Clear Data operations |
| `admin-verify.js` | Admin password verification |
| `ai-chat.js` | Claude API proxy (keeps API key server-side) |
| `deliveries-get.js` | Load deliveries + notes |
| `deliveries-save.js` | Individual delivery/note upsert, delete, counter update |
| `dc-jobs-get.js` | Load service jobs |
| `dc-jobs-save.js` | Save service jobs |
| `employees-get.js` / `employees-save.js` | Employee CRUD |
| `techs-get.js` / `techs-save.js` | Contractor tech CRUD |
| `backup.js` | Full database backup to Vercel Blob (manual + nightly cron) |
| `backup-restore.js` | Restore from backup |
| `health.js` | System health check (Supabase, Redis, AI) |
| `log-ai-usage.js` | AI cost tracking |
| `log-error.js` | Frontend error logging |
| `upload.js` / `dc-upload.js` | File upload to Vercel Blob |
| `delivery-photo-upload.js` / `delivery-photo-delete.js` | Delivery photo management |
| `import-customers.js` | Customer CSV/XLS import |
| `daily-picks.js` | Sports picks feature (uses Redis as primary) |

### Other Files
| File | Purpose |
|------|---------|
| `/images/logos/dc-appliance-logo-transparent.png` | DC Appliance logo |
| `vercel.json` | Vercel config — CORS headers, cron jobs |
| `deploy.sh` | Quick deploy script: `git add -A && git commit && git push` |
| `redis-backup.mjs` | One-time Redis export utility |
| `supabase-*.sql` | Database migration scripts |

---

## DATABASE — SUPABASE

### Multi-Tenant Architecture
- **All tables have `store_id` column** for multi-tenant support
- **DC Appliance = `store_id: 1`**
- All queries MUST filter by `store_id`
- Session tokens carry `store_id` — extracted in `_auth.js`

### Soft Delete Pattern
Protected tables have `deleted BOOLEAN DEFAULT false` and `deleted_at TIMESTAMPTZ`:
- `customers`, `orders`, `order_items`, `products`, `serial_pool`
- Clear Data operations set `deleted=true` (never hard delete)
- All reads filter `.eq('deleted', false)`
- Normal saves only delete `WHERE deleted = false` before reinserting

### Tables
| Table | Purpose |
|-------|---------|
| `stores` | Store configuration (name, address, phone, tax rate, etc.) |
| `employees` | POS employees with PIN, role, permissions |
| `service_techs` | Contractor technicians with password login |
| `sessions` | Auth sessions (token, store_id, employee, expiry) |
| `customers` | Customer records with ledger (payments, adjustments, refunds) |
| `orders` | Sales orders/invoices with delivery link |
| `order_items` | Line items per order with serial, commission, delivery status |
| `products` | Inventory with serial tracking, warranty toggle, specs |
| `serial_pool` | Serial numbers per product (Available/Assigned/Sold) |
| `brands` | Brand list per store |
| `vendors` | Vendor contacts and payment terms |
| `departments` | Product departments |
| `categories` | Product categories (FK to departments) |
| `deliveries` | Delivery stops with appliances, status, photos, log |
| `delivery_notes` | Calendar notes (lunch blocks, full days, reminders) |
| `service_jobs` | Service/repair job tracking |
| `purchase_orders` | PO tracking |
| `purchase_order_items` | PO line items |
| `time_clock` | Employee punch records |
| `counters` | ID counters (next_delivery_id, next_order_id, etc.) |
| `store_config` | Generic key-value config (commissions, tax zones, hot buttons, etc.) |
| `warranty_tiers` | Extended warranty pricing tiers |
| `ai_usage` | AI call tracking (feature, tokens, cost, duration) |
| `error_logs` | Frontend error log (auto-cleaned after 30 days) |

---

## AUTHENTICATION

- **PIN pad login** for all employees on POS, delivery, service pages
- **Session tokens** stored in Supabase `sessions` table (NOT Redis)
- Sessions expire at **midnight daily**
- POS has configurable **inactivity timeout** (default 5 minutes)
- Delivery and service pages stay logged in until midnight
- Contractor techs (Jeff, Justin) use **password login** on service.html
- Admin panel requires **separate admin password** (Owner/Admin only)
- `USE_SUPABASE=true` environment variable must be set in Vercel
- Token rotation runs every 4 hours on POS and delivery pages

---

## KEY FEATURES BUILT

### Sales
- New Sale with cart, live search dropdown (model/name/brand/UPC), hot buttons, category browsing
- 2-row product cards: Model [qty] $price / Description
- Quick-add customer from sale with duplicate detection
- Pre-checkout checklist (notes, warranty prompts)
- Checkout overlay with multi-payment support (Cash, Card, Check, Financing, Charge)
- Sale Complete screen with Print Invoice, Print Shipper, Email buttons
- Invoice and Shipper Copy printing with customer ledger
- Email invoice via EmailJS
- Quote save/load/convert to sale
- Hold/retrieve sales
- Returns with negative line items

### Orders
- Open Orders tab with status tracking
- Order detail with per-item delivery checkboxes and serial entry
- Record Payment on orders (syncs to customer ledger)
- Delivery status badge on orders (Scheduled/Out for Delivery/Delivered)
- Two-way link: Order <-> Delivery (deliveryId on order, invoice on delivery)

### Delivery
- Weekly calendar view (desktop) with drag-and-drop
- Daily route view (mobile delivery.html)
- Auto-create delivery from sale when delivery date is set
- Invoice drag-and-drop with AI extraction (Claude reads invoice, fills form)
- Delivery detail with status changes, photos, log entries, email confirmations
- Serial number entry prompt before marking Delivered
- Individual record saves (no full-array overwrite — race condition safe)

### Service
- Service job creation and tracking
- AI chat assistant for natural language job scheduling
- Status workflow: Needs Claimed -> In Progress -> Service Complete
- Part ordering tracking, customer contact tracking
- POS and dc-service.html share the same data via `/api/dc-jobs-*`

### Inventory
- Product list with bulk edit, CSV import
- Serial number pool management (Available/Assigned/Sold)
- AI-powered model lookup (pulls specs from manufacturer sites)
- Product card with tabs: Info, Pricing, Serials, Received, Sales, Stock, Specs
- Print spec sheets with DC Appliance branding
- Offer 5 Year Warranty toggle per product with smart defaults
- Purchase orders and receiving with AI packing slip reading
- Reorder report

### Customers
- Customer list with search
- Profile with account ledger (sales, payments, adjustments, running balance)
- Appliance history with serial numbers
- Quick-add from New Sale tab
- CSV import

### Financial
- Accounts Receivable report with aging buckets
- Commission report by employee
- Sales tax report
- End of month reports
- Per-invoice payment tracking (orderId on every payment)

### Admin
- Categories, Brands, Vendors management
- Commission rates (per-category, per-employee overrides)
- Tax zones (multi-zone support)
- Employee management with PIN, role, permissions
- Extended warranty tier configuration
- Data import (inventory CSV/XLS, customer CSV, SmartTouch sales journal, serial reports)
- Data clear (soft delete only)
- Database backups (manual + nightly cron to Vercel Blob, last 30 kept)
- AI Usage dashboard (cost tracking per feature, employee, day)
- System Status (Supabase/Redis/AI health, backup status)
- Error Log (last 50 frontend errors)
- Store settings (name, address, logo, invoice message, delivery terms)
- POS settings (invoice message, delivery charge, inactivity timeout, hot buttons)

### AI Features
All AI calls go through `/api/ai-chat` proxy with 15s timeout, 1 retry, fallback to manual entry:
| Feature | ID | Used In |
|---------|-----|---------|
| Invoice scanning | `invoice_scan` | delivery.html, pos delivery tab |
| Serial photo reading | `serial_scan` | delivery.html (mobile) |
| Product spec lookup | `product_specs` | pos-inventory.js |
| Service job assistant | `job_assistant` | service.html |
| AI chat assistant | `ai_assistant` | pos-admin.js, pos-dashboard.js |
| Serial import | `serial_import` | pos-admin.js |
| Sales journal import | `sales_journal_import` | pos-admin.js |
| Packing slip reading | `packing_slip_scan` | pos-inventory.js |
| Price update import | `price_update` | pos-admin.js |

---

## EMPLOYEES

| Name | Role | Auth |
|------|------|------|
| Chandler | Owner/Admin | Admin password |
| Dasha | CSR | PIN |
| Sam | General Manager | PIN |
| Shayla | Sales | PIN |
| Bonice | Sales | PIN |
| Dalton | Sales | PIN |
| Daniel | Sales | PIN |
| Mario | Sales | PIN |
| Jeff | Independent contractor tech | Password login on service.html |
| Justin | Independent contractor tech | Password login on service.html |

---

## BUSINESS INFO — DC APPLIANCE

| Field | Value |
|-------|-------|
| Address | 2610 Central Ave Suite B, Dodge City KS 67801 |
| Phone | 620-371-6417 |
| Email | dodgecityappliance@gmail.com |
| Hours | Mon-Fri 9am-7pm, Sat 9am-5pm, Sun Closed |
| Google Review | https://g.page/r/CYNnKIyyF1AwEBM/review |
| Tax county | Dodge City — 9.000% |
| Brands | GE, Whirlpool, Speed Queen, Cafe, KitchenAid, Maytag, Napoleon, Traeger, Gozney, Halo, Pit Boss, Tempur-Pedic, Sealy, Stearns & Foster, La-Z-Boy, Ashley |

---

## IMPORTANT RULES — NEVER VIOLATE

1. **Never use bulk delete/replace pattern** on any protected table
2. **Always use upsert** for delivery/note saves (individual record operations only)
3. **Always filter by `store_id`** on every database query
4. **Never hard delete** protected tables — use soft delete (`deleted=true`)
5. **Always check `_delDataLoaded` / `_delDataLoaded`** guard before any save
6. **Never send full array replacements** to the deliveries API — use action-based ops
7. **Individual record operations only:** add = POST one, edit = PATCH one, delete = soft delete one
8. **Sessions are in Supabase** — never use Redis for auth
9. **AI calls must have fallback** — 15s timeout, 1 retry, graceful fallback to manual entry
10. **All new features must be multi-tenant** — no hardcoded DC Appliance values

---

## DELIVERY SAVE PATTERN (Critical)

Deliveries use individual operations, NOT full-array saves:

```
// POS (pos-inventory.js)
delSaveOne(delivery)      // upsert one delivery
delDeleteOne(id)          // delete one delivery
delSaveNote(note)         // upsert one note
delDeleteOneNote(id)      // delete one note
delSaveCounter()          // update ID counters

// delivery.html
saveOneDelivery(delivery) // upsert one delivery
deleteOneDelivery(id)     // delete one delivery
saveOneNote(note)         // upsert one note
deleteOneNote(id)         // delete one note
saveDelCounter()          // update ID counters
```

The API (`/api/deliveries-save.js`) supports:
- `action: 'upsert'` + `delivery: {...}` — single delivery upsert
- `action: 'delete'` + `id: '...'` — single delivery delete
- `action: 'upsert-note'` + `note: {...}` — single note upsert
- `action: 'delete-note'` + `id: '...'` — single note delete
- `action: 'update-counter'` + `nextId/nextNoteId` — counter update
- Legacy bulk array is supported for backwards compatibility but should not be used

---

## APPLIANCE OS — FUTURE SAAS

- DC Appliance is `store_id = 1` and the flagship customer
- All features must work for any store generically
- No hardcoded DC Appliance values — everything pulls from store settings
- Planned pricing: Starter $99/mo, Pro $199/mo, Enterprise $399/mo
- Twilio SMS integration planned (porting 620-371-6417 from Podium)
- dodgecityappliance.com e-commerce site planned

---

## PENDING / IN PROGRESS

- Twilio SMS — waiting to port phone number from Podium
- dodgecityappliance.com website build
- Staging environment setup
- Podium API integration (when approved)
- Go-live data import (clear test data, import real inventory/customers/sales)

---

## CRON JOBS (vercel.json)

| Schedule | Path | Purpose |
|----------|------|---------|
| `0 14 * * *` (2pm UTC / 8am CST) | `/api/daily-picks` | Sports picks |
| `0 6 * * *` (6am UTC / midnight CST) | `/api/backup` | Nightly database backup |

---

## ENVIRONMENT VARIABLES (Vercel)

| Variable | Purpose |
|----------|---------|
| `USE_SUPABASE` | Must be `"true"` — enables Supabase as primary data store |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_KEY` | Claude API key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `KV_REST_API_URL` | Upstash Redis URL |
| `KV_REST_API_TOKEN` | Upstash Redis token |
| `SUPER_ADMIN_PASSWORD` | Admin panel password |
