# Electrician Manager — Architecture & Roadmap

> Comprehensive design conversation: system overview, architecture review, financial accounting design, RBAC, SaaS migration, and performance refactor. Code in this document is production-grade reference material.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema (Local)](#3-database-schema-local)
4. [Feature Audit](#4-feature-audit)
5. [Folder Structure](#5-folder-structure)
6. [Financial Handling Analysis](#6-financial-handling-analysis)
7. [Senior Architect Review](#7-senior-architect-review)
8. [Production SaaS Roadmap](#8-production-saas-roadmap)
9. [Supabase Migration Architecture](#9-supabase-migration-architecture)
10. [Role-Based Access Control](#10-role-based-access-control)
11. [Backend-Driven Permission System](#11-backend-driven-permission-system)
12. [Structured Accounting System](#12-structured-accounting-system)
13. [Performance Refactor](#13-performance-refactor)
14. [Safe Cloud Migration Plan](#14-safe-cloud-migration-plan)
15. [What Was Built Today](#15-what-was-built-today)

---

## 1. System Overview

### Purpose

A fully offline, browser-based business management system built for electricians and small contracting companies. Manages the complete business lifecycle — quoting, project execution, materials, payments, financial reporting. All data lives in `localStorage` with manual JSON export/import for backup. No server, no cloud.

### Main Modules

| # | Module | Route |
|---|--------|--------|
| 1 | Dashboard | `/` |
| 2 | Clients | `/clients` |
| 3 | Projects | `/projects` |
| 4 | Quotations | `/quotations` |
| 5 | Sales Invoices | `/sales-invoices` |
| 6 | Work Orders | `/work-orders` |
| 7 | Employees + Labor Log | `/employees` |
| 8 | Inventory | `/inventory` |
| 9 | Stock Report | `/inventory-report` |
| 10 | Suppliers | `/suppliers` |
| 11 | Purchase Invoices | `/purchase-invoices` |
| 12 | Payments + Receipts | `/payments` (tabbed) |
| 13 | Banks | `/banks` |
| 14 | Checks | `/checks` |
| 15 | Transfers | `/transfers` |
| 16 | Journal Entries | `/journal-entries` |
| 17 | Chart of Accounts | `/chart-of-accounts` |
| 18 | Exchange Rates | `/exchange-rates` |
| 19 | Statements (Client/Supplier/Bank) | various |
| 20 | Reports | `/reports` |
| 21 | Warranties | `/warranties` |
| 22 | Settings | `/settings` |

### User Roles (Designed)

| Role | Access |
|------|--------|
| **Admin** | Full access; user management; settings |
| **Manager** | Operational full; financials hidden |
| **Accountant** | Finance full; operations read-only |
| **Technician** | Assigned work orders + inventory only |

### Languages & Regions
- Bilingual: English / Arabic with full RTL layout
- Multi-currency: ILS, USD, JOD, EUR, SAR, AED, EGP, GBP
- Theme: Dark / Light

---

## 2. Technical Architecture

### Stack

```
React 18 + TypeScript + Vite
TailwindCSS + lucide-react
Zustand (with persist middleware) — state + persistence
React Router v6 — routing
WebAuthn — biometric login (optional)
IndexedDB (via imageService) — image storage
```

### Frontend Structure

```
src/
├── main.tsx                  # React root + ErrorBoundary + global handlers
├── App.tsx                   # Router + auth gate
├── index.css                 # Tailwind base + custom utility classes
│
├── types/index.ts            # All TypeScript interfaces (single source of truth)
│
├── store/
│   ├── useStore.ts           # Zustand store: state + 67 actions + 14 derived calcs
│   └── chartOfAccountsSeed.ts# Seed data for default CoA
│
├── hooks/
│   ├── useT.ts               # Bilingual i18n hook
│   ├── useSelectors.ts       # Narrow store subscriptions + memoized helpers
│   └── usePagination.ts      # Client-side pagination
│
├── utils/
│   ├── helpers.ts            # ID gen, formatting, date utils
│   └── translations.ts       # Static i18n strings (nav/groups)
│
├── services/                 # Backend-ready abstractions (scaffolded, partially used)
│   ├── dataService.ts        # Stable API wrapper around store
│   ├── dataProvider.ts       # local | remote provider switch
│   ├── selectors.ts          # Normalized FK resolvers
│   ├── backup.ts             # Safe backup/restore + safeMigrate
│   ├── imageService.ts       # IndexedDB image storage (USED in Inventory)
│   ├── errorSafety.ts        # Global error handlers + emergency restore
│   └── providers/
│       ├── types.ts          # DataProvider interface
│       ├── localProvider.ts  # Wraps Zustand store
│       └── remoteProvider.ts # Mock for cloud migration
│
├── migrations/               # Versioned schema migrations
│   ├── index.ts              # runMigrations() runner
│   ├── v1-to-v2.ts           # Baseline (no-op)
│   └── v2-to-v3.ts           # Image refs (non-destructive)
│
└── components/               # 30+ page + utility components
    ├── Layout.tsx            # Sidebar + RTL flex
    ├── Login.tsx             # Auth gate
    ├── ErrorBoundary.tsx     # Top-level safety net
    ├── PaginationControls.tsx# Reusable pagination footer
    ├── ItemImage.tsx         # IndexedDB-aware image renderer
    ├── SearchableSelect.tsx  # Search dropdown w/ quick-create
    ├── ShareModal.tsx        # WhatsApp / email share template
    └── [page components]     # Dashboard, Clients, Projects, etc.
```

### Backend Logic

There is no backend (currently). All business logic runs in the browser inside the Zustand store. The store acts as both data layer and service layer.

Key patterns:
- **ID generation**: `PREFIX + YEAR + 6-digit-counter` (e.g. `PAY2026000042`)
- **Side effects on mutation**: Auto-create checks from check payments; auto-create stock movements from purchase invoices; auto-reconcile invoices when payments change; auto-link postdated bank accounts to current accounts
- **Guard logic**: Deletions blocked when entity has dependent records
- **Persistence**: Zustand `persist` middleware writes entire JSON state to `localStorage['electrician-manager-v1']` on every mutation

### Data Flow

```
User input → component local state (form fields)
          → store action (e.g. addPayment)
          → set() mutates state
          → side effects run (reconcile, auto-create)
          → Zustand notifies subscribers
          → narrowly-subscribed components re-render
```

---

## 3. Database Schema (Local)

> Engine: `localStorage` JSON blob. All IDs are strings: `PREFIX2026XXXXXX`.

### Entity Counts: 19 tables + counters + settings

| Table | Key Fields | Notes |
|-------|-----------|-------|
| `clients` | name, phone, email, address, taxNumber | |
| `projects` | clientId, name, status, budget, dates | status: pending/active/completed/cancelled/on_hold |
| `items` | name, category, sku, unit, costPrice, sellingPrice, serialNumber, costCurrency, costExchangeRate, imageUrl | imageUrl is IndexedDB ref or legacy base64 |
| `stockMovements` | itemId, type, quantity, projectId, supplierId, unitCost, date | type: in/out/adjustment |
| `suppliers` | name, phone, email, address | |
| `banks` | name, bankName, accountType, currency, initialBalance, linkedBankId | accountType: cash/current/checks_box/postdated/returned_checks |
| `payments` | direction, type, amount, currency, supplierId/clientId, projectId, bankAccountId, **purchaseInvoiceId**, **salesInvoiceId**, checkId, check fields | NEW: invoice linking for precise reconciliation |
| `checks` | checkNumber, type, status, amount, currency, dates, payeeName, paidToName | status: pending/deposited/cleared/bounced/cancelled/returned/paid_to |
| `transfers` | fromAccountId, toAccountId, amount, fee | |
| `receipts` | clientId, lineItems, subtotal, discount, tax, total, paymentMethod, receivedAccountId, salesInvoiceId | Receipt = simplified invoice or settlement |
| `quotations` | clientId, title, status, lineItems, total, validUntil | converts to project on accepted |
| `workOrders` | projectId, title, status, priority, assignedTo, materials | |
| `employees` | name, role, dailyRate, isActive | |
| `laborEntries` | employeeId, projectId, hours, dailyRate, totalCost | |
| `warranties` | itemId, projectId, clientId, manufacturer, serialNumber, dates, status | |
| `purchaseInvoices` | supplierId, lineItems, total, paidAmount, status, currency, exchangeRate | status auto-managed by reconciliation |
| `exchangeRates` | currency, rate, date | rate = units of default per 1 foreign |
| `journalEntries` | date, reference, lines (debit/credit), totalDebit, totalCredit | |
| `chartAccounts` | code, nameEn, nameAr, type, parentCode, isSystem, isActive | NEW |
| `photos` | entityType, entityId, dataUrl, caption | |

### Singletons

```typescript
settings: {
  language:       'en' | 'ar'    // default: 'ar'
  theme:          'dark' | 'light'
  currency:       string         // default: 'ILS'
  taxRate:        number         // default: 16
  companyName:    string
  companyPhone:   string
  companyAddress: string
}

counters: {
  CLT, PRJ, ITM, STK, SUP, BNK, PAY, CHK, TRF, RCP,
  QOT, WRK, EMP, LBR, WRT, PUR, XRT, JRN, ACC
}
```

### Relationships

```
Client ─────────────────┬── Project ───── WorkOrder ── Employee
  │                     │      │              │
  ├── Receipt           │      │              ├── materials → Item
  ├── Payment(in)       │      │              │
  ├── Check(received)   │      │              └── LaborEntry
  └── Quotation ────────┘      │
                               │
Supplier ─────────────────────┤
  ├── PurchaseInvoice ─────────┤
  │     └── lineItems → Item
  ├── Payment(out) → reconciles → PurchaseInvoice.paidAmount
  └── Check(issued)

BankAccount ◄── Payment / Transfer / Check / Receipt
            ◄── linkedBankId (postdated → current)
```

---

## 4. Feature Audit

### ✅ Completed (43 features)

**Sales & Quoting** — Full CRUD on Clients, Projects, Quotations, Sales Invoices; Quotation→Project conversion; Print + WhatsApp share.

**Operations** — Work Orders w/ material planning; Employee CRUD; Labor log; Photo attachments.

**Inventory** — Item CRUD w/ categories, SKU, serial numbers, foreign-currency cost; Stock movements (in/out/adjust); Low-stock alerts; Auto stock-in from purchase invoices; **IndexedDB image storage**.

**Suppliers** — Full CRUD; Purchase Invoices; Auto-reconciliation; Statements.

**Finance** — Payments out/in (tabbed); Receipts simplified; Check lifecycle (full state machine); Bank accounts (5 types); Postdated auto-creation; Transfers; Multi-currency; **Journal Entries**; Bank/Client/Supplier statements.

**Accounting Foundation (NEW)** — Chart of Accounts w/ 50 seeded accounts; Account types; Journal lines linkable to CoA.

**System** — Bilingual EN/AR; Dark/Light theme; Export/Import JSON; **ErrorBoundary**; Global error handlers; Schema migrations; Print on every doc; WebAuthn biometric.

### 🟡 Partial

| Feature | Status |
|---------|--------|
| **Pagination** | Hook + component built; wired into Payments, Inventory, Checks |
| **Memoized selectors** | Hook expanded; wired into 4 critical components |
| **Sales invoice paid status** | `getSalesInvoicePaid()` + `getSalesInvoiceStatus()` derived calcs added; UI feedback loop pending |
| **Stock deduction from work orders** | quantityUsed tracked but doesn't auto-create movements |
| **Journal entries integration** | Manual only; not generated from transactions |
| **Photo attachments** | Available on 4 entity types only |
| **Reconciliation precision** | **FIXED**: payments now have `purchaseInvoiceId`; precise per-invoice matching with FIFO fallback for legacy data |

### ❌ Missing

**Critical** — Multi-user/RBAC; Cloud sync; Expense categories; Payroll module; Payment reminders; Global search.

**Financial** — Trial Balance UI; Balance Sheet UI; Cash Flow Statement; VAT report; AR/AP aging; Recurring payments.

**Infrastructure** — PWA; Audit log; Soft deletes; CSV import; Multi-company; Push notifications.

---

## 5. Folder Structure

See [Section 2](#2-technical-architecture) for full tree.

### Root Config

| File | Purpose |
|------|---------|
| `package.json` | React 18, react-dom, react-router-dom v6, zustand v4.5, lucide-react |
| `vite.config.ts` | Vite + React fast-refresh |
| `tsconfig.json` | Strict TS, ESNext target |
| `postcss.config.js` | Tailwind + autoprefixer |

### Key Modules

- **`useStore.ts`** — single Zustand store, all state and 67+ actions
- **`useSelectors.ts`** — narrow subscriptions, `useStoreActions()`, `useById()`, `useTableData()`, `useDashboardSummary()`
- **`usePagination.ts`** — client-side pagination with auto-clamp
- **`imageService.ts`** — IndexedDB image storage with legacy base64 fallback
- **`backup.ts`** — `backupData()`, `restoreData()`, `safeMigrate()`
- **`errorSafety.ts`** — global handlers, error log ring buffer, emergency restore
- **`dataProvider.ts`** — local | remote switch (USE_REMOTE flag)

---

## 6. Financial Handling Analysis

### Invoice Creation

Three invoice types, each with own flow:

**Quotations**
```
Form → Save (status: draft|sent|accepted|rejected|expired)
↓
Math:
  subtotal = Σ(qty × unitPrice)
  discount = subtotal × discountPercent/100
  tax      = (subtotal - discount) × taxPercent/100
  total    = subtotal - discount + tax
↓
If accepted → "Convert to Project" button → creates new Project
```

**Sales Invoices** — Same line-item structure + payment method + receivedAccountId.

**Purchase Invoices** — Auto-creates stock-in movements; `paidAmount` + status auto-managed by reconciliation.

### Payment Flow

**Outgoing (Payments tab)**
```
Form: Supplier → Invoice (optional) → Amount → Method → "Paid From" account
       (cash → cash accounts only)
       (check → checks_box accounts only)
       (bank_transfer → current accounts only)
↓
Save:
  Payment record (direction='out', entityType='supplier')
  If method=check → auto-create Check record, link checkId
  reconcilePurchaseInvoice triggered
```

**Incoming (Receipts tab)**
```
Form: Client → Amount → Method → "Received At" account → Sales Invoice (optional settlement)
↓
Save:
  Receipt record
  salesInvoiceId stored for paid-status feedback loop
```

### Check Lifecycle

```
ISSUED:
  pending → cancelled
  pending → cleared

RECEIVED:
  pending → deposited (to postdated account)
         → bounced
         → returned
         → cancelled
         → paid_to (forwarded to third party)
  deposited → cleared (moves to current account balance)
           → bounced/returned
```

### Bank Balance Calculation

| Account Type | Formula |
|--------------|---------|
| `cash` | initialBalance + Σ(payments in) − Σ(payments out) |
| `current` | initialBalance + Σ(non-cash payments) ± transfers + cleared checks |
| `checks_box` | Σ(received checks where status=pending) |
| `postdated` | Σ(received checks where status=deposited, linkedBankId match) |
| `returned_checks` | Σ(received checks where status=bounced or returned) |

### Reconciliation Logic (FIXED)

```typescript
reconcilePurchaseInvoice(invoiceId) {
  // 1. Precise: payments linked to this exact invoice
  linkedPaid = sum(payments where purchaseInvoiceId === invoiceId)

  // 2. Detect mode: any payments linked at all for this supplier?
  if (any payment for supplier has purchaseInvoiceId) {
    newPaid = min(linkedPaid, invoice.total)   // modern path
  } else {
    // Legacy fallback: FIFO across supplier's invoices
    sortedInvoices = supplier's invoices sorted by date
    remaining = sum(all supplier payments)
    newPaid = 0
    for (each invoice in chronological order) {
      if (invoice === target) {
        newPaid = min(remaining, target.total); break
      }
      remaining -= invoice.total
    }
  }

  status = paid if newPaid >= total
         | partial if newPaid > 0
         | received otherwise
}
```

---

## 7. Senior Architect Review

### Security Risks (Pre-fix)

1. **Authentication is a prototype** — hardcoded `admin/admin`, localStorage flag, no session validation
2. **Plaintext business data** in localStorage — exposed in DevTools
3. **No input sanitization** — XSS surface in custom print/share templates
4. **Base64 image bloat** breaks localStorage 5MB cap silently → **FIXED** via imageService
5. **No audit trail** — legal requirement gap

### Scalability Issues

1. **Single JSON blob** serialized on every mutation
2. **O(n) lookups** — `.find()` on every render → **FIXED** via `useById()`
3. **Derived values recompute every render** → **FIXED** via memoized selectors in Dashboard
4. **No multi-tenancy** — no `userId`/`organizationId` foundation
5. **localStorage isn't a database** — sync, single-thread, 5MB cap

### Performance Problems

1. **No pagination** → **FIXED** in Payments, Inventory, Checks
2. **Dashboard performance bomb** → **FIXED** via memoized aggregations
3. **Base64 images block everything** → **FIXED** via IndexedDB refs
4. **Full state deserialization on cold start**
5. **React re-render cascade** from wide subscriptions → **FIXED** via narrow `useStore(s => s.x)` selectors

### Bad Design Decisions (Pre-fix)

1. **Reconciliation matched supplier-wide, not per invoice** → **FIXED** with `purchaseInvoiceId` field
2. **Four disconnected expense mechanisms** (payments / purchase invoices / labor / journal)
3. **Journal entries had no financial effect** — decorative
4. **Sales invoices had no paid status** → **FIXED** via `getSalesInvoicePaid()` + `getSalesInvoiceStatus()`
5. **Service layer existed but unused** — components import store directly
6. **No error boundaries** → **FIXED** via `<ErrorBoundary>` in `main.tsx`
7. **Hardcoded currency lists** in multiple components (still pending)

---

## 8. Production SaaS Roadmap

### Phase 0 — Fix What's Broken (Week 1–2)

- ✅ Fix reconciliation bug
- ✅ Wire ErrorBoundary
- ✅ Wire imageService for Inventory
- ✅ Pagination in Payments / Checks / Inventory
- ✅ Sales invoice paid-status feedback
- 🟡 Stock deduction from work orders (still pending)

### Phase 1 — Financial Engine (Month 1)

- 🟡 Expense categories (pending)
- 🟡 Journal Entry integration with bank balances + P&L (pending)
- 🟡 AR / AP aging reports (pending)
- 🟡 Overdue alerts (pending)
- 🟡 Payroll module (pending)

### Phase 2 — Connect Service Layer (Month 2)

- Migrate components from `useStore` → `dataService`
- ✅ Wire `useSelectors` into Dashboard, Payments, Inventory, Checks
- ✅ Wire `usePagination` into list views
- Activate `errorSafety` guards on all mutations
- Centralize CURRENCIES config

### Phase 3 — Real Auth + Multi-User (Month 3)

- Choose Supabase / Auth0 / Clerk
- Add `userId` to every entity (migration v3→v4)
- Implement role system (Admin, Manager, Accountant, Technician)
- JWT with refresh, force logout on password change
- Audit log table

### Phase 4 — Real Backend + Database (Month 4–5)

- Supabase (Postgres + Auth + Storage + Realtime)
- Activate `remoteProvider.ts` (already scaffolded)
- One-time data migration from localStorage
- Row-Level Security for tenant isolation
- Add `payment_invoices` junction table (precise reconciliation)

### Phase 5 — Financial Reporting (Month 5–6)

- Proper P&L, Balance Sheet, Cash Flow Statement
- VAT Report
- AR/AP Aging Detail

### Phase 6 — SaaS Infrastructure (Month 6–8)

- Multi-tenancy w/ subdomain routing
- Subscription billing (Stripe)
- Onboarding wizard + bulk import
- Email notifications + automated PDFs
- Public REST API + webhooks
- Mobile (React Native or PWA)

---

## 9. Supabase Migration Architecture

### Why Supabase Over Firebase

| Factor | Supabase (Postgres) | Firebase (Firestore) |
|--------|---------------------|----------------------|
| Data model fit | Relational ✓ | Document — needs flattening |
| Financial queries | GROUP BY, JOIN, SUM native | Manual aggregation |
| Multi-tenant | Row-Level Security built-in | Manual security rules |
| Reconciliation FK | Foreign key constraints | None |
| Self-hostable | Yes | No |
| Cost at scale | Predictable | Per-read pricing |

### Core Multi-Tenancy Pattern

Every business table gets:

```sql
organization_id  UUID  NOT NULL REFERENCES organizations(id)
created_by       UUID  NOT NULL REFERENCES auth.users(id)
created_at       TIMESTAMPTZ DEFAULT now()
updated_at       TIMESTAMPTZ DEFAULT now()
deleted_at       TIMESTAMPTZ                              -- soft delete
```

### Foundation Tables

```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  currency      TEXT DEFAULT 'ILS',
  tax_rate      NUMERIC(5,2) DEFAULT 16,
  language      TEXT DEFAULT 'en',
  plan          TEXT DEFAULT 'free',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id         UUID NOT NULL REFERENCES roles(id),
  employee_id     UUID REFERENCES employees(id),
  is_active       BOOLEAN DEFAULT TRUE,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email           TEXT NOT NULL,
  role_id         UUID NOT NULL REFERENCES roles(id),
  token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  diff            JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_org_time ON audit_log(organization_id, created_at DESC);
```

### Critical Bug Fix Schema — Payment ↔ Invoice Junction

```sql
CREATE TABLE payment_invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id  UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(15,2) NOT NULL,
  UNIQUE (payment_id, invoice_id)
);

CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE purchase_invoices SET
    paid_amount = (
      SELECT COALESCE(SUM(pi.amount), 0)
      FROM payment_invoices pi
      JOIN payments p ON p.id = pi.payment_id
      WHERE pi.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        AND p.deleted_at IS NULL
    ),
    status = CASE
      WHEN paid_amount >= total THEN 'paid'
      WHEN paid_amount > 0      THEN 'partial'
      ELSE 'received'
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_invoices
AFTER INSERT OR UPDATE OR DELETE ON payment_invoices
FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();
```

### Auth Service

```typescript
// src/services/authService.ts
import { supabase } from '../lib/supabase'

export const authService = {
  async signUp(email: string, password: string, companyName: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: companyName } },
    })
    if (error) throw error
    const { error: orgError } = await supabase.rpc('create_organization_for_user', {
      org_name: companyName, user_id: data.user!.id,
    })
    if (orgError) throw orgError
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  },

  async signOut() { await supabase.auth.signOut() },
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },
}
```

---

## 10. Role-Based Access Control

### Role Definitions

| Role | Trust Level | Description |
|------|-------------|-------------|
| **Admin** | Unlimited | Business owner |
| **Manager** | High operational | Site lead; no financial visibility |
| **Accountant** | High financial | Bookkeeper; ops read-only |
| **Technician** | Limited | Field worker; assigned work only |

### Permission Levels

```
NONE   → Module hidden, API returns 403
READ   → View list + detail
WRITE  → Create + edit (implies READ)
DELETE → Soft-delete (implies WRITE)
FULL   → WRITE + DELETE + configuration
```

### RBAC Tables

```sql
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  label_en    TEXT NOT NULL,
  label_ar    TEXT NOT NULL,
  is_system   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO roles (name, label_en, label_ar, is_system) VALUES
  ('admin',      'Admin',      'مدير النظام', TRUE),
  ('manager',    'Manager',    'المدير',      TRUE),
  ('accountant', 'Accountant', 'المحاسب',     TRUE),
  ('technician', 'Technician', 'الفني',       TRUE);

CREATE TABLE modules (
  id          TEXT PRIMARY KEY,
  name_en     TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  group_name  TEXT
);

CREATE TABLE permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES roles(id),
  module_id     TEXT NOT NULL REFERENCES modules(id),
  can_read      BOOLEAN DEFAULT FALSE,
  can_write     BOOLEAN DEFAULT FALSE,
  can_delete    BOOLEAN DEFAULT FALSE,
  hidden_fields JSONB   DEFAULT '[]',
  row_scope     TEXT    DEFAULT 'organization',
  custom_rules  JSONB   DEFAULT '{}',
  UNIQUE (role_id, module_id)
);

CREATE TABLE org_permission_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  role_id         UUID NOT NULL REFERENCES roles(id),
  module_id       TEXT NOT NULL REFERENCES modules(id),
  can_read        BOOLEAN,
  can_write       BOOLEAN,
  can_delete      BOOLEAN,
  hidden_fields   JSONB,
  row_scope       TEXT,
  custom_rules    JSONB,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, role_id, module_id)
);
```

### Row Scope Rules

```
organization  → all records in org
assigned      → only records assigned to this user
own           → only records created by this user
none          → no access
```

### Permission Matrix Highlights

| Module | Admin | Manager | Accountant | Technician |
|--------|-------|---------|-----------|-----------|
| Dashboard | FULL | READ (ops only) | READ | LIMITED (own) |
| Clients | FULL | WRITE (no balance) | READ | READ (assigned) |
| Projects | FULL | WRITE (no $ amounts) | READ | READ (assigned) |
| Sales Invoices | FULL | READ | FULL | NONE |
| Work Orders | FULL | WRITE | NONE | WRITE (own only) |
| Inventory | FULL | WRITE | READ | WRITE (out from WO only) |
| Payments | FULL | NONE | FULL | NONE |
| Receipts | FULL | NONE | FULL | NONE |
| Banks | FULL | NONE | FULL | NONE |
| Checks | FULL | NONE | FULL | NONE |
| Journal Entries | FULL | NONE | FULL | NONE |
| Reports | FULL | OPS only | FULL | NONE |
| Settings | FULL | READ | READ | NONE |

### Field-Level Hiding (Manager Example)

```typescript
// Manager sees these fields hidden:
clients:    ['taxNumber', 'balance', 'totalInvoiced']
projects:   ['financials.totalReceived', 'financials.totalSpent', 'financials.balance']
inventory:  []   // sees costPrice (needed for planning)
employees:  []   // sees dailyRate (needed for planning)

// Custom rule:
projects.budget_percent_only = true
// → "73% of budget used" instead of raw amounts
```

### RLS Policy Helper Functions

```sql
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION user_can(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH eff AS (
    SELECT
      COALESCE(o.can_read,   p.can_read)   AS can_read,
      COALESCE(o.can_write,  p.can_write)  AS can_write,
      COALESCE(o.can_delete, p.can_delete) AS can_delete
    FROM permissions p
    JOIN organization_members om ON om.role_id = p.role_id
    LEFT JOIN org_permission_overrides o
      ON o.role_id = p.role_id
     AND o.organization_id = om.organization_id
     AND o.module_id = p.module_id
    WHERE om.user_id = auth.uid() AND p.module_id = p_module
  )
  SELECT CASE p_action
    WHEN 'read'   THEN bool_or(can_read)
    WHEN 'write'  THEN bool_or(can_write)
    WHEN 'delete' THEN bool_or(can_delete)
  END FROM eff
$$;

CREATE OR REPLACE FUNCTION user_row_scope(p_module TEXT)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT row_scope FROM org_permission_overrides
     WHERE module_id = p_module
       AND organization_id = current_org_id()
       AND role_id IN (SELECT role_id FROM organization_members WHERE user_id = auth.uid())
     LIMIT 1),
    (SELECT row_scope FROM permissions p
     JOIN organization_members om ON om.role_id = p.role_id
     WHERE p.module_id = p_module AND om.user_id = auth.uid()
     LIMIT 1),
    'none'
  )
$$;
```

### Example RLS Policy

```sql
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_orders_select" ON work_orders FOR SELECT USING (
  organization_id = current_org_id()
  AND deleted_at IS NULL
  AND user_can('work_orders', 'read')
  AND (
    user_row_scope('work_orders') = 'organization'
    OR (
      user_row_scope('work_orders') = 'assigned'
      AND assigned_to = (
        SELECT employee_id FROM organization_members
        WHERE user_id = auth.uid() LIMIT 1
      )
    )
  )
);
```

---

## 11. Backend-Driven Permission System

> Replaces the static frontend `ROLE_PERMISSIONS` object that drifts from DB. Single source of truth = Postgres.

### SQL Function

```sql
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE (
  module         TEXT,
  can_read       BOOLEAN,
  can_write      BOOLEAN,
  can_delete     BOOLEAN,
  row_scope      TEXT,
  hidden_fields  JSONB,
  custom_rules   JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH membership AS (
    SELECT role_id, organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
      AND is_active = TRUE
    LIMIT 1
  )
  SELECT
    p.module_id                                                AS module,
    COALESCE(o.can_read,      p.can_read,      FALSE)          AS can_read,
    COALESCE(o.can_write,     p.can_write,     FALSE)          AS can_write,
    COALESCE(o.can_delete,    p.can_delete,    FALSE)          AS can_delete,
    COALESCE(o.row_scope,     p.row_scope,     'none')         AS row_scope,
    COALESCE(o.hidden_fields, p.hidden_fields, '[]'::jsonb)    AS hidden_fields,
    COALESCE(o.custom_rules,  p.custom_rules,  '{}'::jsonb)    AS custom_rules
  FROM membership m
  JOIN permissions p
    ON p.role_id = m.role_id
  LEFT JOIN org_permission_overrides o
    ON  o.role_id         = m.role_id
    AND o.organization_id = m.organization_id
    AND o.module_id       = p.module_id
$$;

REVOKE ALL ON FUNCTION public.get_my_permissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_permissions() TO authenticated;


CREATE OR REPLACE FUNCTION public.get_my_permissions_map()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_object_agg(
      module,
      jsonb_build_object(
        'can_read',      can_read,
        'can_write',     can_write,
        'can_delete',    can_delete,
        'row_scope',     row_scope,
        'hidden_fields', hidden_fields,
        'custom_rules',  custom_rules
      )
    ),
    '{}'::jsonb
  )
  FROM public.get_my_permissions();
$$;

REVOKE ALL ON FUNCTION public.get_my_permissions_map() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_permissions_map() TO authenticated;
```

### Indexes

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_user_active
  ON organization_members (user_id)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_permissions_role_module
  ON permissions (role_id, module_id);

CREATE INDEX IF NOT EXISTS idx_overrides_lookup
  ON org_permission_overrides (role_id, organization_id, module_id);
```

### Example Response

```jsonc
{
  "clients":   { "can_read": true,  "can_write": true,  "can_delete": false, "row_scope": "organization", "hidden_fields": ["taxNumber","balance"],     "custom_rules": {} },
  "projects":  { "can_read": true,  "can_write": true,  "can_delete": false, "row_scope": "organization", "hidden_fields": ["financials.totalReceived"],"custom_rules": { "budget_percent_only": true } },
  "payments":  { "can_read": false, "can_write": false, "can_delete": false, "row_scope": "none",         "hidden_fields": [],                          "custom_rules": {} },
  "inventory": { "can_read": true,  "can_write": true,  "can_delete": false, "row_scope": "organization", "hidden_fields": [],                          "custom_rules": {} },
  "reports":   { "can_read": true,  "can_write": false, "can_delete": false, "row_scope": "organization", "hidden_fields": ["financialPL"],             "custom_rules": { "operational_only": true } }
}
```

### Frontend — Service with Cache

```typescript
// src/services/permissions/permissionsService.ts
import { supabase } from '../../lib/supabase'

export type Action   = 'read' | 'write' | 'delete'
export type RowScope = 'organization' | 'assigned' | 'own' | 'none'

export interface ModulePermission {
  can_read:      boolean
  can_write:     boolean
  can_delete:    boolean
  row_scope:     RowScope
  hidden_fields: string[]
  custom_rules:  Record<string, boolean>
}

export type PermissionMap = Record<string, ModulePermission>

const STORAGE_KEY = 'rbac:perms:v1'
const TTL_MS      = 15 * 60 * 1000

interface CacheEntry {
  userId:    string
  fetchedAt: number
  data:      PermissionMap
}

let inflight: Promise<PermissionMap> | null = null

export const permissionsService = {
  async fetch(): Promise<PermissionMap> {
    const { data, error } = await supabase.rpc('get_my_permissions_map')
    if (error) throw error
    return (data ?? {}) as PermissionMap
  },

  async load(userId: string, force = false): Promise<PermissionMap> {
    if (!force) {
      const cached = readCache(userId)
      if (cached) return cached
    }
    if (inflight) return inflight
    inflight = (async () => {
      try {
        const map = await this.fetch()
        writeCache(userId, map)
        return map
      } finally {
        inflight = null
      }
    })()
    return inflight
  },

  invalidate(): void {
    sessionStorage.removeItem(STORAGE_KEY)
  },
}

function readCache(userId: string): PermissionMap | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (entry.userId !== userId) return null
    if (Date.now() - entry.fetchedAt > TTL_MS) return null
    return entry.data
  } catch {
    return null
  }
}

function writeCache(userId: string, data: PermissionMap): void {
  const entry: CacheEntry = { userId, fetchedAt: Date.now(), data }
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry)) } catch {}
}
```

### Frontend — Provider + Hook

```typescript
// src/hooks/usePermissions.ts
import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  permissionsService,
  type Action,
  type PermissionMap,
  type ModulePermission,
} from '../services/permissions/permissionsService'

interface Ctx {
  ready:       boolean
  permissions: PermissionMap
  refresh:     () => Promise<void>
}

const PermissionsContext = createContext<Ctx | null>(null)

const EMPTY_PERM: ModulePermission = {
  can_read: false, can_write: false, can_delete: false,
  row_scope: 'none', hidden_fields: [], custom_rules: {},
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady]             = useState(false)
  const [permissions, setPermissions] = useState<PermissionMap>({})

  async function load(force = false) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setPermissions({})
      setReady(true)
      return
    }
    const map = await permissionsService.load(session.user.id, force)
    setPermissions(map)
    setReady(true)
  }

  useEffect(() => {
    load(false)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        permissionsService.invalidate()
        setPermissions({})
        setReady(true)
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        permissionsService.invalidate()
        load(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<Ctx>(() => ({
    ready,
    permissions,
    refresh: () => load(true),
  }), [ready, permissions])

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissions must be used inside <PermissionsProvider>')

  const { permissions, ready, refresh } = ctx

  return useMemo(() => ({
    ready,
    refresh,
    get(module: string): ModulePermission {
      return permissions[module] ?? EMPTY_PERM
    },
    can(module: string, action: Action): boolean {
      const p = permissions[module]
      if (!p) return false
      if (action === 'read')   return p.can_read
      if (action === 'write')  return p.can_write
      if (action === 'delete') return p.can_delete
      return false
    },
    canAccess(module: string): boolean {
      return permissions[module]?.can_read ?? false
    },
    hiddenFields(module: string): string[] {
      return permissions[module]?.hidden_fields ?? []
    },
    rowScope(module: string): string {
      return permissions[module]?.row_scope ?? 'none'
    },
    rule(module: string, name: string): boolean {
      return permissions[module]?.custom_rules?.[name] ?? false
    },
  }), [permissions, ready, refresh])
}
```

### Wiring + Usage

```typescript
// src/main.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// usage in a component
const { can, canAccess, hiddenFields, rule, ready } = usePermissions()
if (!ready) return null
if (!canAccess('payments')) return <Forbidden />
{can('payments', 'write') && <button>New</button>}
{!hiddenFields('clients').includes('balance') && <td>{balance}</td>}
{rule('projects', 'budget_percent_only') ? <Bar /> : <input name="budget" />}
```

### Cache Invalidation Triggers

- `SIGNED_OUT` → clear cache
- `SIGNED_IN` / `TOKEN_REFRESHED` / `USER_UPDATED` → invalidate + refetch
- 15-minute TTL on stale cache
- Manual `refresh()` after admin changes role/permissions

---

## 12. Structured Accounting System

### Chart of Accounts (50 seeded accounts)

```
1xxx — Assets
  1100 Cash on Hand
  1110 Petty Cash
  1200 Bank Accounts → 1210 Current
  1300 Accounts Receivable
  1310 Checks in Box
  1320 Postdated Checks
  1400 Inventory
  1500 Fixed Assets → Tools, Vehicles, Office Equipment, Accumulated Depreciation

2xxx — Liabilities
  2100 Accounts Payable
  2110 Checks Payable
  2200 VAT Payable
  2300 Accrued Expenses → 2310 Accrued Salaries
  2400 Customer Deposits
  2500/2600 Loans

3xxx — Equity
  3100 Owner's Capital
  3200 Retained Earnings
  3300 Owner's Drawings
  3400 Current Year Profit/Loss

4xxx — Revenue
  4100 Service Revenue → Installation, Maintenance, Consultation
  4200 Sales Revenue → Materials Sales
  4300 Other Income → Discount Received

5xxx — Expenses
  5100 Cost of Materials → Direct Materials Used, Materials Purchased
  5200 Labor Cost → Direct Labor, Subcontractor
  5300 Operating → Rent, Utilities, Transport, Fuel, Maintenance, Office, Mobile, Insurance
  5400 Financial → Bank Charges, Interest, Currency Loss
  5500 Depreciation → Equipment
  5900 Miscellaneous
```

### Auto Journal-Entry Rules

| Transaction | Debit | Credit |
|------------|-------|--------|
| **Receipt (cash)** | Cash 1100 | A/R 1300 |
| **Receipt (check)** | Checks in Box 1310 | A/R 1300 |
| **Check deposited** | Postdated 1320 | Checks in Box 1310 |
| **Check cleared** | Bank 1210 | Postdated 1320 |
| **Sales invoice issued** | A/R 1300 (total) | Service Revenue 4100 (net) + VAT Payable 2200 (tax) |
| **Purchase invoice received** | Inventory 1400 (net) + VAT Receivable (tax) | A/P 2100 (total) |
| **Payment to supplier** | A/P 2100 | Cash/Bank/Checks Payable |
| **Materials used (stock out)** | Direct Materials 5110 | Inventory 1400 |
| **Labor entry** | Direct Labor 5210 | Accrued Salaries 2310 |
| **Bank transfer** | Destination Bank | Source Bank + Bank Charges (fee) |

### SQL Tables

```sql
CREATE TABLE account_types (
  id              TEXT PRIMARY KEY,
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  normal_balance  TEXT NOT NULL,   -- 'debit' | 'credit'
  statement       TEXT NOT NULL    -- 'balance_sheet' | 'income_statement'
);

INSERT INTO account_types VALUES
  ('asset',     'Assets',      'الأصول',        'debit',  'balance_sheet'),
  ('liability', 'Liabilities', 'الخصوم',        'credit', 'balance_sheet'),
  ('equity',    'Equity',      'حقوق الملكية',  'credit', 'balance_sheet'),
  ('revenue',   'Revenue',     'الإيرادات',     'credit', 'income_statement'),
  ('expense',   'Expenses',    'المصروفات',      'debit',  'income_statement');

CREATE TABLE chart_of_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  code             TEXT NOT NULL,
  name_en          TEXT NOT NULL,
  name_ar          TEXT NOT NULL,
  account_type     TEXT NOT NULL REFERENCES account_types(id),
  parent_id        UUID REFERENCES chart_of_accounts(id),
  is_system        BOOLEAN DEFAULT FALSE,
  is_active        BOOLEAN DEFAULT TRUE,
  description      TEXT,
  linked_entity    TEXT,        -- 'bank_account' | 'client' | 'supplier'
  linked_entity_id UUID,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE account_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  mapping_key     TEXT NOT NULL,
  account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
  UNIQUE (organization_id, mapping_key)
);
```

### Trial Balance Function

```sql
CREATE OR REPLACE FUNCTION get_trial_balance(
  p_org_id    UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  account_code    TEXT,
  account_name_en TEXT,
  account_name_ar TEXT,
  account_type    TEXT,
  total_debit     NUMERIC,
  total_credit    NUMERIC,
  tb_debit        NUMERIC,
  tb_credit       NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT
    a.code,
    a.name_en,
    a.name_ar,
    a.account_type,
    COALESCE(SUM(l.debit),  0),
    COALESCE(SUM(l.credit), 0),
    CASE WHEN t.normal_balance = 'debit'
      THEN GREATEST(COALESCE(SUM(l.debit), 0) - COALESCE(SUM(l.credit), 0), 0)
      ELSE GREATEST(COALESCE(SUM(l.credit), 0) - COALESCE(SUM(l.debit), 0), 0)
    END,
    CASE WHEN t.normal_balance = 'credit'
      THEN GREATEST(COALESCE(SUM(l.credit), 0) - COALESCE(SUM(l.debit), 0), 0)
      ELSE GREATEST(COALESCE(SUM(l.debit), 0) - COALESCE(SUM(l.credit), 0), 0)
    END
  FROM chart_of_accounts a
  JOIN account_types t ON t.id = a.account_type
  JOIN journal_entry_lines l ON l.account_id = a.id
  JOIN journal_entries je ON je.id = l.journal_entry_id
  WHERE a.organization_id = p_org_id
    AND je.is_posted = TRUE
    AND je.date <= p_to_date
    AND (p_from_date IS NULL OR je.date >= p_from_date)
  GROUP BY a.code, a.name_en, a.name_ar, a.account_type, t.normal_balance
  HAVING SUM(l.debit) > 0 OR SUM(l.credit) > 0
  ORDER BY a.code
$$;
```

### Balance Sheet Function

```sql
CREATE OR REPLACE FUNCTION get_balance_sheet(p_org_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'date', p_date,
    'assets',           (SELECT jsonb_agg(jsonb_build_object('code',code,'name_en',name_en,'balance',balance) ORDER BY code) FROM ... WHERE account_type='asset'),
    'total_assets',     (SELECT COALESCE(SUM(balance),0) FROM ... WHERE account_type='asset'),
    'liabilities',      (SELECT ... WHERE account_type='liability'),
    'total_liabilities',(SELECT COALESCE(SUM(balance),0) FROM ... WHERE account_type='liability'),
    'equity',           (SELECT ... WHERE account_type='equity'),
    'total_equity',     (SELECT COALESCE(SUM(balance),0) FROM ... WHERE account_type='equity')
  ) INTO v_result;
  RETURN v_result;
END;
$$;
```

### Local TypeScript Implementation (Already Built)

```typescript
// src/types/index.ts
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface ChartAccount {
  id:          string          // ACC2026000001
  code:        string
  nameEn:      string
  nameAr:      string
  type:        AccountType
  parentCode?: string
  isSystem:    boolean
  isActive:    boolean
  description?: string
  createdAt:   string
}

export interface JournalLine {
  id:           string
  accountName:  string          // free-text fallback
  accountId?:   string          // → ChartAccount.id
  debit:        number
  credit:       number
  notes:        string
}
```

```typescript
// src/store/useStore.ts — actions
addChartAccount(data)
updateChartAccount(id, data)
deleteChartAccount(id)         // blocks deletion of isSystem accounts
seedChartOfAccounts()          // idempotent — populates 50 default accounts
```

---

## 13. Performance Refactor

### Strategy

```
Layer 1: Narrow store subscriptions (useSelectors)
  → Stop re-rendering on unrelated state changes

Layer 2: Memoized lookups + filters
  → Stop re-computing on every render

Layer 3: Pagination
  → Stop rendering thousands of rows
```

### useSelectors Expansion

```typescript
// src/hooks/useSelectors.ts

// Narrow subscriptions
export const useClients          = () => useStore(s => s.clients)
export const useProjects         = () => useStore(s => s.projects)
// ... + useStockMovements, useTransfers, useReceipts, useJournalEntries,
//        usePurchaseInvoices, useExchangeRates, useSettings

// Stable action refs (never trigger re-render)
export const useStoreActions = () => useStore(useShallow(s => ({
  addClient: s.addClient,    updateClient: s.updateClient,    deleteClient: s.deleteClient,
  addPayment: s.addPayment,  updatePayment: s.updatePayment,  deletePayment: s.deletePayment,
  // ... all 67 actions
})))

// O(1) lookup map
export function useById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return useMemo(() => {
    const m = new Map<string, T>()
    for (const r of rows) m.set(r.id, r)
    return m
  }, [rows])
}

// Combined search + filter + sort
export function useTableData<T>(rows: T[], options: {
  search?: string
  searchFields?: Array<keyof T>
  filter?: (row: T) => boolean
  sort?: (a: T, b: T) => number
}): T[] {
  // ... memoized
}
```

### PaginationControls Component

```typescript
// src/components/PaginationControls.tsx
export function PaginationControls({
  page, pageCount, pageSize, total, hasNext, hasPrev,
  onPageChange, onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}: Props) {
  // First / Prev / page indicator / Next / Last
  // Page size selector
  // Hidden when total === 0
}
```

### Component Refactor Pattern (Payments example)

```typescript
// BEFORE
const { payments, suppliers, addPayment, ... } = useStore()
const filtered = payments.filter(...).filter(...).sort(...)
{filtered.map(p => {
  const supplier = suppliers.find(s => s.id === p.supplierId)   // O(n)
  ...
})}

// AFTER
const payments  = usePayments()              // narrow
const suppliers = useSuppliers()             // narrow
const { addPayment } = useStoreActions()     // stable refs

const supplierById = useById(suppliers)      // O(1) lookups

const filtered = useTableData(payments, {    // memoized filter+sort
  search,
  searchFields: ['id', 'description', 'notes'],
  filter: useCallback((p) => p.direction === 'out', []),
  sort:   useCallback((a, b) => b.date.localeCompare(a.date), []),
})

const { items: pageItems, page, pageCount, ... } = usePagination(filtered, { initialPageSize: 25 })

{pageItems.map(p => (
  <PaymentRow                                // memoized
    payment={p}
    supplier={supplierById.get(p.supplierId ?? '')}
    ...
  />
))}

<PaginationControls page={page} pageCount={pageCount} ... />
```

### Dashboard Memoization

```typescript
// Bank balances — Map computed once per relevant change
const bankBalances = useMemo(() => {
  const map = new Map<string, number>()
  for (const b of banks) map.set(b.id, getBankBalance(b.id))
  return map
}, [banks, payments, checks, stockMovements, getBankBalance])

// Stock — single-pass aggregation
const stockByItemId = useMemo(() => {
  const map = new Map<string, number>()
  // Group + fold movements once
  return map
}, [stockMovements, items])

// Single-pass check aggregation (replaces 6 filter().reduce() chains)
const checkAgg = useMemo(() => {
  let issuedThis = 0, issuedNext = 0, issuedTotal = 0, issuedCount = 0
  let recvThis  = 0, recvNext  = 0, recvTotal  = 0, recvCount  = 0
  for (const c of checks) {
    if (c.status !== 'pending') continue
    if (c.type === 'issued') {
      issuedTotal += c.amount; issuedCount++
      if (c.dueDate.startsWith(thisMonthStr)) issuedThis += c.amount
      if (c.dueDate.startsWith(nextMonthStr)) issuedNext += c.amount
    } else if (c.type === 'received') {
      // ... mirror
    }
  }
  return { issuedDueThisMonth: issuedThis, ... }
}, [checks, thisMonthStr, nextMonthStr])
```

### Memoized Row Pattern

```typescript
const PaymentRow = memo(function PaymentRow({
  payment, supplier, ...
}: RowProps) {
  // Only re-renders when its specific props change
  return <tr>...</tr>
})
```

### Image Service Wiring

```typescript
// Inventory.tsx — upload
async function handleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const ref = await saveImage(file)              // → IndexedDB ref
    setForm(f => ({ ...f, imageUrl: ref }))
  } catch {
    // Fallback: legacy base64
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, imageUrl: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }
}

// ItemImage.tsx — universal renderer
export function ItemImage({ src, ... }: Props) {
  const [resolved, setResolved] = useState<string>('')
  useEffect(() => {
    if (!src) { setResolved(''); return }
    if (isImageRef(src)) {
      resolveImageSrc(src).then(setResolved)       // async load from IndexedDB
    } else {
      setResolved(src)                             // legacy base64 passthrough
    }
  }, [src])
  if (!resolved) return null
  return <img src={resolved} ... />
}
```

---

## 14. Safe Cloud Migration Plan

### Migration Philosophy

```
RULE 1: Never delete local data until cloud is verified.
RULE 2: Every step must be reversible.
RULE 3: User can keep working during migration.
RULE 4: If anything fails, automatic rollback.
RULE 5: Backup file is downloaded BEFORE anything changes.
```

### Phase Flow

```
Step 1: DOWNLOAD BACKUP FILE          (auto to Downloads)
Step 2: SIGN UP / SIGN IN             (Supabase, create org)
Step 3: VALIDATE LOCAL DATA           (counts, orphan detection, warnings)
Step 4: UPLOAD TO STAGING             (chunks of 500, retry × 3)
Step 5: VERIFY UPLOAD                 (count match + spot checks)
Step 6: PROMOTE STAGING → PRODUCTION  (atomic SQL transaction)
Step 7: SET USE_REMOTE = true         (flip data provider)
Step 8: SHADOW PERIOD (7 days)        (cloud primary, local read-only backup)
Step 9: USER CONFIRMS                 (or auto-confirm after 7 days)
Step 10: ARCHIVE LOCAL DATA           (kept 30 days)
Step 11: DELETE LOCAL DATA            (after 30 more days)
```

### Migration State Machine

```typescript
// src/services/migration/migrationState.ts
export type MigrationStatus =
  | 'not_started'
  | 'backup_downloaded'
  | 'auth_completed'
  | 'validating'
  | 'uploading'
  | 'verifying'
  | 'shadow_mode'        // cloud is live, local kept as backup
  | 'completed'
  | 'rolled_back'
  | 'failed'

interface MigrationState {
  status:           MigrationStatus
  startedAt?:       string
  completedAt?:     string
  shadowUntil?:     string
  organizationId?:  string
  recordCounts?:    Record<string, number>
  errors?:          string[]
  backupFilename?:  string
}
```

### Validation Before Upload

```typescript
function step2_validate(): ValidationReport {
  const s = useStore.getState()
  const report = { isValid: true, recordCounts: {}, orphans: [], warnings: [], blockers: [] }

  report.recordCounts = {
    clients: s.clients.length, projects: s.projects.length, ...
  }

  // Orphan detection
  const clientIds  = new Set(s.clients.map(c => c.id))
  const orphanProjects = s.projects.filter(p => p.clientId && !clientIds.has(p.clientId))
  if (orphanProjects.length > 0) {
    report.orphans.push({ type: 'projects (missing client)', ids: orphanProjects.map(p => p.id) })
    report.warnings.push(`${orphanProjects.length} projects reference deleted clients`)
  }

  // Storage size warning
  const dataSize = new Blob([JSON.stringify(s)]).size
  if (dataSize > 4 * 1024 * 1024) {
    report.warnings.push(`Your data is ${(dataSize / 1024 / 1024).toFixed(1)}MB`)
  }

  return report
}
```

### Upload with ID Mapping

```typescript
class IdMapper {
  private map = new Map<string, string>()
  to(oldId: string): string {
    if (!this.map.has(oldId)) this.map.set(oldId, crypto.randomUUID())
    return this.map.get(oldId)!
  }
  toOptional(oldId?: string | null): string | null {
    return oldId ? this.to(oldId) : null
  }
}

async function step3_upload(orgId, userId, onProgress) {
  const local = useStore.getState()
  const ids = new IdMapper()
  const meta = (createdAt) => ({ organization_id: orgId, created_by: userId, created_at: createdAt })

  // Order matters: parents before children
  await insertBatch('clients',  local.clients.map(c => ({ id: ids.to(c.id), ...meta(c.createdAt), name: c.name, ... })))
  await insertBatch('suppliers', ...)
  await insertBatch('projects', local.projects.map(p => ({ id: ids.to(p.id), client_id: ids.toOptional(p.clientId), ... })))
  // ... continues for all 19 entities

  // Two-pass: bank accounts (self-referential)
  // Pass 1: insert without linkedBankId
  // Pass 2: update linkedBankId
}
```

### Shadow Mode Behavior

```typescript
function step5_enterShadowMode(orgId, userId) {
  localStorage.setItem('use_remote', 'true')
  localStorage.setItem('cloud_org_id', orgId)

  // Lock original local data — read-only
  const liveData = localStorage.getItem('electrician-manager-v1')
  if (liveData) localStorage.setItem('electrician-manager-v1__archived', liveData)

  const shadowUntil = new Date()
  shadowUntil.setDate(shadowUntil.getDate() + 7)

  migrationState.set({
    status: 'shadow_mode',
    shadowUntil: shadowUntil.toISOString(),
    organizationId: orgId,
  })
}
```

### Rollback (At Any Point)

```typescript
async function rollbackMigration(reason: string) {
  // 1. Restore local data
  const archived = localStorage.getItem('electrician-manager-v1__archived')
  if (archived) {
    localStorage.setItem('electrician-manager-v1', archived)
    localStorage.removeItem('electrician-manager-v1__archived')
  }

  // 2. Switch back to local provider
  localStorage.removeItem('use_remote')
  localStorage.removeItem('cloud_org_id')

  // 3. Cloud data preserved (don't delete)
  console.warn(`Cloud data preserved at org_id=${state.organizationId}`)

  // 4. Mark rolled back
  migrationState.set({ status: 'rolled_back', errors: [reason] })

  // 5. Force reload
  window.location.reload()
}
```

### Failure Recovery Matrix

| Failure Point | Recovery |
|---------------|---------|
| User closes browser mid-upload | Resume from staging on next open |
| Network drops during upload | Auto-retry × 3, then abort with full local data intact |
| Verification finds mismatches | Block migration, present rollback button |
| User changes their mind | One-click rollback during 7-day shadow period |
| Cloud becomes unreachable | Shadow mode auto-falls-back to local read-only |
| Local data corruption pre-upload | Backup file already downloaded |
| User loses laptop during migration | Backup file is on user's Downloads folder |
| Long-term cloud failure | 30-day local archive remains restorable |

### Final Test Plan

```
SMOKE TEST (internal)
  □ Empty account migration (0 records)
  □ Small account (10 of each)
  □ Realistic account (1000+ records)
  □ Account with broken refs (orphans)
  □ Account near localStorage cap (4MB+)

ROLLBACK TEST
  □ After backup
  □ After auth
  □ After partial upload
  □ After full upload
  □ During shadow mode

CONCURRENT WRITE TEST
  □ User adds payment during upload (queued and uploaded after main batch)

EDGE CASES
  □ User has 2 browsers open
  □ User clears localStorage mid-shadow
  □ Cloud RLS rejects an insert
```

---

## 15. What Was Built Today

### Critical Correctness Fixes

1. **Reconciliation bug fixed** — `Payment` now has `purchaseInvoiceId` and `salesInvoiceId` fields. Reconciliation prefers precise per-invoice matching; falls back to FIFO for legacy data.
2. **Sales invoice paid-status loop closed** — `getSalesInvoicePaid()` and `getSalesInvoiceStatus()` derived calculations.
3. **ErrorBoundary wired** — `ErrorBoundary.tsx` with reload / download backup / copy-diagnostics actions.

### Performance

4. **`useSelectors.ts` expanded** — all entity hooks; `useStoreActions()`; `useTableData()` helper; `useShallow` for stable action refs.
5. **`PaginationControls.tsx`** — reusable footer with first/prev/next/last + page-size selector.
6. **Payments refactored** — narrow subscriptions, `useById` for O(1) lookups, memoized filter+sort, paginated 25 rows, memoized `<PaymentRow>`.
7. **Inventory refactored** — narrow subscriptions, single-pass memoized `stockByItemId` + `historyByItemId` maps, pagination at 50, `imageService` wired (IndexedDB), `<ItemImage />` handles both legacy base64 and refs.
8. **Checks refactored** — narrow subscriptions, lookup maps, single-pass aggregation, pagination at 25.
9. **Dashboard refactored** — every aggregation memoized with explicit deps; bank balances precomputed map; replaced `useStore.getState()` anti-pattern with `useById`.

### Accounting Foundation

10. **`ChartAccount` type** + `AccountType` enum + `accountId` field on `JournalLine` (backwards compatible).
11. **CoA store actions** + 50-account seed with EN/AR labels (`seedChartOfAccounts()` is idempotent).
12. **`ChartOfAccounts.tsx`** — grouped by type, parent display, modal w/ duplicate-code validation, "Seed default accounts" button. Routed at `/chart-of-accounts` and added to Finance nav.

### Files Changed

**New:**
- `src/components/ErrorBoundary.tsx`
- `src/components/PaginationControls.tsx`
- `src/components/ItemImage.tsx`
- `src/components/ChartOfAccounts.tsx`
- `src/store/chartOfAccountsSeed.ts`

**Edited:**
- `src/types/index.ts` — Payment fields, JournalLine.accountId, ChartAccount, AccountType, IDCounters.ACC
- `src/store/useStore.ts` — fixed reconciliation, sales invoice helpers, CoA CRUD + seeder, export/import
- `src/hooks/useSelectors.ts` — expanded hooks, action selector, useTableData
- `src/main.tsx` — wraps App in ErrorBoundary
- `src/App.tsx` — `/chart-of-accounts` route
- `src/components/Layout.tsx` — Chart of Accounts nav item
- `src/utils/translations.ts` — `nav.chartOfAccounts` EN/AR
- `src/components/Payments.tsx` — selectors, pagination, invoice picker, memo'd row
- `src/components/Inventory.tsx` — selectors, pagination, imageService, memoized stock map, fixed Fragment key
- `src/components/Checks.tsx` — selectors, pagination, lookup maps, single-pass aggregation
- `src/components/Dashboard.tsx` — memoized aggregations, bank balance map

### Pending (Needs External Infrastructure)

These weren't done today because they require infrastructure not provisioned in this session:

- Supabase backend setup (account, env keys, deployed schema)
- Real auth + RBAC integration (depends on Supabase Auth)
- Migration wizard execution (depends on cloud target existing)
- `get_my_permissions()` deployment to Postgres
- `PermissionsProvider` integration (waits for Supabase)

---

## 16. Continuation Sprint — Auto-Accounting Wired End-to-End

The CoA built earlier is no longer decorative. Real journal entries are now generated automatically from every business transaction, and Trial Balance + Balance Sheet pages render the result.

### What Was Wired

| Transaction | Journal Entry Generated |
|------------|-------------------------|
| **Receipt (cash, no line items)** | DR Cash/Bank/Checks-in-Box · CR A/R |
| **Sales Invoice (Receipt with line items)** | DR A/R (total) · CR Revenue (net) + VAT Payable (tax) |
| **Outgoing payment to supplier** | DR A/P · CR Cash/Bank/Checks-Payable |
| **Purchase invoice received** | DR Inventory + VAT Receivable · CR A/P |
| **Stock movement (out)** | DR Direct Materials · CR Inventory |
| **Labor entry** | DR Direct Labor · CR Accrued Salaries |
| **Bank transfer** | DR Destination · CR Source · DR Bank Charges (if fee) |
| **Check pending → deposited** | DR Postdated · CR Checks in Box |
| **Check deposited → cleared** | DR Bank Account · CR Postdated |

### New Files

```
src/services/accounting/
  journalGenerator.ts      # 9 pure generator functions, balanced + traceable
  balances.ts              # computeAccountBalances, getTrialBalance, getBalanceSheet, getIncomeStatement
src/components/
  TrialBalance.tsx         # /trial-balance — grouped by type, balance check, print
  BalanceSheet.tsx         # /balance-sheet — Assets vs Liabilities + Equity, equation check
```

### Store Changes

- `accountMappings: AccountMapping[]` state slice
- `setAccountMapping`, `seedAccountMappings`, `getMappedAccount` actions
- `seedChartOfAccounts` now auto-seeds mappings
- `_journalCtx` internal helper for generators
- `addReceipt`, `addPayment`, `addPurchaseInvoice`, `addStockMovement`, `addLaborEntry`, `addTransfer` wired
- `updateCheck`, `bulkUpdateCheckStatus` emit deposit/cleared entries on transitions
- `updateWorkOrder` emits stock-out movements on `quantityUsed` deltas
- New `JournalEntrySource` enum + `source` / `sourceId` on `JournalEntry`

### Type Additions

```typescript
export type AccountMappingKey =
  | 'cash' | 'accounts_receivable' | 'checks_in_box' | 'postdated_checks'
  | 'inventory' | 'accounts_payable' | 'checks_payable'
  | 'vat_payable' | 'vat_receivable' | 'accrued_salaries'
  | 'service_revenue' | 'sales_revenue'
  | 'direct_materials' | 'direct_labor' | 'bank_charges'

export interface AccountMapping {
  key:         AccountMappingKey
  accountCode: string                 // ChartAccount.code (1100, 2200, etc.)
}

export type JournalEntrySource =
  | 'manual' | 'receipt' | 'payment' | 'sales_invoice' | 'purchase_invoice'
  | 'stock_movement' | 'labor_entry' | 'bank_transfer'
  | 'check_deposit' | 'check_cleared'
```

### Operational Improvements

- **Stock deduction from work orders**: `updateWorkOrder` now diffs `materials[].quantityUsed` and emits `type: 'out'` stock movements for positive deltas. Each emission also triggers the journal generator (DR Direct Materials, CR Inventory) — a single material-usage edit now updates inventory AND books simultaneously.
- **Overdue invoice alerts on Dashboard**: Two new alert rows
  - Orange: purchase invoices past `dueDate` and not fully paid
  - Pink: sales invoices created 30+ days ago and not fully settled
  Both show the days-overdue count and link to the relevant page.

### Key Design Choices

- **Generator failures never break the source transaction**. Every wiring point wraps the generator call in `try/catch` and logs to the console. The user's payment/receipt/invoice always saves; bookkeeping degrades gracefully.
- **Mapping resolution is lazy**. `_journalCtx` reads accounts and mappings from the live store on every call, so newly-seeded accounts are immediately resolvable.
- **No double-entry on duplicate paths**. Receipts with line items go through `onSalesInvoiceCreated` (revenue side); plain receipts go through `onReceiptCreated` (cash collection). They never overlap.
- **Trial balance and balance sheet are pure functions**. No DB roundtrip — the components fold the in-memory journal entries on each render through `useMemo`. Performance is fine for the data volumes a single-business app generates.
- **Date filtering follows accounting convention**: trial balance "as of" includes everything ≤ that date; balance sheet does the same; income statement takes a date range.

---

## Appendix: Commands & Conventions

### ID Format
```
PREFIX + YEAR + 6-digit-counter
CLT2026000001  → Client #1
PRJ2026000003  → Project #3
PAY2026000023  → Payment #23
ACC2026000001  → Chart Account #1
JRN2026000001  → Journal Entry #1
```

### Counter Prefixes
```
CLT  Clients
PRJ  Projects
ITM  Items
STK  Stock Movements
SUP  Suppliers
BNK  Bank Accounts
PAY  Payments
CHK  Checks
TRF  Transfers
RCP  Receipts
QOT  Quotations
WRK  Work Orders
EMP  Employees
LBR  Labor Entries
WRT  Warranties
PUR  Purchase Invoices
XRT  Exchange Rates
JRN  Journal Entries
ACC  Chart Accounts (NEW)
```

### Account Code Convention (CoA)
```
1xxx — Assets       (debit normal balance)
2xxx — Liabilities  (credit normal balance)
3xxx — Equity       (credit normal balance)
4xxx — Revenue      (credit normal balance)
5xxx — Expenses     (debit normal balance)
```

### Payment Account Filtering
```
cash         → banks where accountType = 'cash'
check        → banks where accountType = 'checks_box'
bank_transfer → banks where accountType = 'current'
```

### Check Status Machine
```
pending → deposited → cleared
       ↘ bounced
       ↘ returned
       ↘ paid_to
       ↘ cancelled

deposited → cleared
         ↘ bounced
         ↘ returned
```

---

*Document generated as a comprehensive reference for the Electrician Manager system. Each section contains production-ready code or design decisions that have been implemented or are ready to implement.*
