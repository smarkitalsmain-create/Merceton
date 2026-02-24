# Complete Database Schema Sync Fix

## Problem
Runtime errors: `Invalid prisma.platformInvoice.findMany() invocation: The table 'public.platform_invoices' does not exist`

After rebuilding the DB schema from scratch, Prisma schema, migrations, and actual Postgres database were out of sync.

## Root Cause Analysis

1. **Schema updated but database not synced**: New models added to `schema.prisma` but tables not created in database
2. **No validation**: No checks to catch missing tables before runtime
3. **Inconsistent workflow**: Unclear whether to use `db push` or migrations

## Solution Implemented

### A) Connection Verification ✅

**File:** `lib/prisma.ts`
- Added DEV-only logging that prints database host and database name (password hidden)
- Logs connection info on Prisma client initialization
- Helps verify we're connecting to the intended database

**File:** `scripts/db-readiness-check.js`
- Enhanced to log connection info (host, database) without password
- Verifies connection before checking tables

### B) Prisma Usage Inventory ✅

**All models in schema.prisma (24 models):**
1. `Merchant` → `merchants`
2. `User` → `users`
3. `StorefrontSettings` → `storefront_settings`
4. `StorefrontPage` → `storefront_pages`
5. `Product` → `products`
6. `ProductImage` → `product_images`
7. `Order` → `orders`
8. `OrderItem` → `order_items`
9. `Shipment` → `shipments`
10. `Refund` → `refunds`
11. `OrderEvent` → `order_events`
12. `Payment` → `payments`
13. `LedgerEntry` → `ledger_entries`
14. `PayoutBatch` → `payout_batches`
15. `PricingPackage` → `pricing_packages`
16. `MerchantFeeConfig` → `merchant_fee_configs`
17. `AdminAuditLog` → `admin_audit_logs`
18. `PlatformSettings` → `platform_settings`
19. `MerchantOnboarding` → `merchant_onboarding`
20. `MerchantStatusEvent` → `merchant_status_events`
21. `PlatformBillingProfile` → `platform_billing_profile`
22. `PlatformSettlementCycle` → `platform_settlement_cycles`
23. `PlatformInvoice` → `platform_invoices` ⚠️ (was missing)
24. `PlatformInvoiceLineItem` → `platform_invoice_line_items`
25. `MerchantStoreSettings` → `merchant_store_settings` ⚠️ (was missing)
26. `MerchantBankAccount` → `merchant_bank_accounts` ⚠️ (was missing)

**All models verified in codebase:**
- All `prisma.*` usages match schema model names
- All table mappings (`@@map`) are correct
- All relations are properly defined

### C) Table Mappings Verified ✅

All models use `@@map()` directives correctly:
- Snake_case table names for Postgres
- Model names in code (camelCase) map to table names (snake_case)
- Example: `PlatformInvoice` model → `prisma.platformInvoice` → `platform_invoices` table

### D) Database Sync Workflow ✅

**File:** `package.json`

**Updated scripts:**
- `db:push` - Syncs schema to DB + regenerates client (dev)
- `db:reset` - **NEW**: `prisma db push --force-reset` + regenerate (dev safety, deletes data)
- `db:readiness` - Checks all critical tables exist
- `db:migrate` - Creates migration + applies + regenerates (prod)
- `db:studio` - Opens Prisma Studio

**Workflow:**
- **Development**: Use `db:push` for quick schema sync (no migration files)
- **Production**: Use `db:migrate` for versioned migrations
- **After schema changes**: Always run `db:push` or `db:migrate`
- **Before starting dev**: Run `db:readiness` to verify tables exist

### E) PlatformInvoice Verified ✅

**Schema:** `prisma/schema.prisma`
```prisma
model PlatformInvoice {
  id            String              @id @default(cuid())
  merchantId    String
  cycleId       String
  invoiceNumber String               @unique
  invoiceDate   DateTime
  currency      String               @default("INR")
  subtotal      Decimal              @db.Decimal(10, 2)
  gstAmount     Decimal              @db.Decimal(10, 2)
  total         Decimal              @db.Decimal(10, 2)
  status        PlatformInvoiceStatus @default(ISSUED)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  merchant  Merchant                @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  cycle     PlatformSettlementCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  lineItems PlatformInvoiceLineItem[]
  payouts   PayoutBatch[]

  @@map("platform_invoices")
}
```

**Relations verified:**
- ✅ `Merchant` relation exists
- ✅ `PlatformSettlementCycle` relation exists
- ✅ `PlatformInvoiceLineItem[]` relation exists
- ✅ `PayoutBatch[]` relation exists

**Code usage:** `lib/billing/queries.ts`
- ✅ All queries use correct field names
- ✅ All relations properly included
- ✅ Field mappings fixed (invoiceEmail, invoicePhone, etc.)

### F) Database Readiness Check ✅

**File:** `scripts/db-readiness-check.js`

**Enhanced to check:**
- Database connection (with connection info logging)
- All 26 critical tables exist
- All Prisma models are accessible
- Clear error messages with fix instructions

**Integrated into:**
- Dev startup check (`scripts/dev-startup-check.js`)
- Can be run standalone: `npm run db:readiness`

## Files Changed

1. ✅ `lib/prisma.ts` - Added connection logging (DEV-only)
2. ✅ `scripts/db-readiness-check.js` - Enhanced with connection logging and all models
3. ✅ `package.json` - Updated `db:reset` to use `db push --force-reset`
4. ✅ `scripts/dev-startup-check.js` - Already includes readiness check

## Commands to Recreate Database from Schema

### Option 1: Force Reset (Recommended for Dev - Deletes All Data)

```bash
# WARNING: This deletes all existing data
npm run db:reset

# Verify all tables exist
npm run db:readiness
```

### Option 2: Push Schema (Safer - Only Creates Missing Tables)

```bash
# Syncs schema to database (creates missing tables, updates existing)
npm run db:push

# Verify all tables exist
npm run db:readiness
```

### Option 3: Migrations (For Production)

```bash
# Create and apply migration
npm run db:migrate

# Verify all tables exist
npm run db:readiness
```

## Verification Checklist

After running `npm run db:push` or `npm run db:reset`:

- [ ] Run `npm run db:readiness` - should show all tables exist
- [ ] Check dev server logs - should show connection info (host, database)
- [ ] Check Prisma logs - should list all available models
- [ ] Test merchant dashboard - should not crash
- [ ] Test billing pages - should not show "table does not exist" errors
- [ ] Test admin pages - should load without errors
- [ ] Run `npm run build` - should succeed

## Expected Output

### After `npm run db:push`:
```
✔ Generated Prisma Client
✔ Database schema synced successfully
```

### After `npm run db:readiness`:
```
[DB Readiness Check] ✓ Database connection successful
[DB Readiness Check] Connected to: { host: 'xxx.neon.tech:5432', database: 'neondb' }
[DB Readiness Check] ✓ Table 'platform_invoices' exists
[DB Readiness Check] ✓ Model 'platformInvoice' is accessible
...
[DB Readiness Check] ✓ All critical tables exist and are accessible
```

### Dev Server Startup:
```
[Prisma] Connecting to database: { host: 'xxx.neon.tech:5432', database: 'neondb', provider: 'postgresql' }
[Prisma] Available models: adminAuditLog, ledgerEntry, merchant, merchantBankAccount, ...
[DB Readiness Check] ✓ All critical tables exist and are accessible
```

## Prevention

- ✅ Dev startup check includes database readiness validation
- ✅ Connection info logged (helps verify correct database)
- ✅ Clear error messages guide users to fix missing tables
- ✅ `db:push` automatically regenerates Prisma client
- ✅ README documents the sync process

## Notes

- **Development**: Use `db:push` for quick schema sync (no migration files)
- **Production**: Use `db:migrate` to create versioned migrations
- **After pulling changes**: Always run `db:push` or `db:migrate` to sync schema
- **Before starting dev**: Run `db:readiness` to verify tables exist
- **Connection logging**: Only in DEV mode, password never logged

## Next Steps

1. **Run database sync:**
   ```bash
   npm run db:reset  # or npm run db:push
   ```

2. **Verify readiness:**
   ```bash
   npm run db:readiness
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

The app should now work without "table does not exist" errors.
