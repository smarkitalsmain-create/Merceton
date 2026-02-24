# Database Schema Sync Fix Summary

## Problem
Runtime errors: `Invalid prisma.<model>.findMany() invocation: The table 'public.platform_invoices' does not exist`

After rebuilding the DB schema from scratch, the Prisma schema, migrations, and actual Postgres database were out of sync.

## Root Cause
1. Schema was updated with new models (`PlatformInvoice`, `MerchantStoreSettings`, etc.)
2. Database tables were not created (migrations not run or `db push` not executed)
3. No validation to catch missing tables before runtime

## Solution Implemented

### 1. Added Database Readiness Check Script
**File:** `scripts/db-readiness-check.js`

- Checks if critical tables exist in the database
- Verifies Prisma models are accessible
- Provides clear error messages with fix instructions
- Can be run standalone: `npm run db:readiness`

**Critical tables checked:**
- `merchants`
- `users`
- `orders`
- `products`
- `platform_invoices` ⚠️ (was missing)
- `merchant_onboarding`
- `merchant_store_settings` ⚠️ (was missing)
- `payout_batches`

### 2. Updated Package.json Scripts
**File:** `package.json`

**Added:**
- `db:readiness` - Check database readiness
- `db:reset` - Reset database + regenerate client (standardized)

**Updated:**
- `db:push` - Now automatically runs `prisma generate` after push

### 3. Enhanced Dev Startup Check
**File:** `scripts/dev-startup-check.js`

- Now includes database readiness check
- Non-blocking (warns but doesn't prevent dev server start)
- Provides clear instructions to fix

### 4. Updated README Documentation
**File:** `README.md`

**Added sections:**
- Database sync instructions (Option A: `db:push` for dev, Option B: `db:migrate` for prod)
- Database readiness verification step
- Troubleshooting for "table does not exist" errors
- Complete list of available database scripts

## Files Changed

1. ✅ `scripts/db-readiness-check.js` - NEW: Database readiness validation
2. ✅ `package.json` - Added `db:readiness` and `db:reset` scripts
3. ✅ `scripts/dev-startup-check.js` - Added readiness check to startup
4. ✅ `README.md` - Updated with sync instructions and troubleshooting

## Commands to Fix Database

### For Development (Recommended)
```bash
# Sync schema to database (creates missing tables)
npm run db:push

# Verify all tables exist
npm run db:readiness
```

### For Production (Using Migrations)
```bash
# Create and apply migration
npm run db:migrate

# Verify all tables exist
npm run db:readiness
```

### If Database is Completely Out of Sync
```bash
# WARNING: This deletes all data
npm run db:reset

# Then verify
npm run db:readiness
```

## Verification

After running `npm run db:push` or `npm run db:migrate`, verify:

```bash
npm run db:readiness
```

Expected output:
```
[DB Readiness Check] ✓ All critical tables exist and are accessible
```

## Schema Mapping Verification

All models use `@@map()` directives to map to snake_case table names:

- `PlatformInvoice` → `platform_invoices` ✅
- `PlatformInvoiceLineItem` → `platform_invoice_line_items` ✅
- `PlatformBillingProfile` → `platform_billing_profile` ✅
- `PlatformSettlementCycle` → `platform_settlement_cycles` ✅
- `MerchantStoreSettings` → `merchant_store_settings` ✅
- `MerchantBankAccount` → `merchant_bank_accounts` ✅

All mappings are correct in `prisma/schema.prisma`.

## Next Steps

1. **Run database sync:**
   ```bash
   npm run db:push
   ```

2. **Verify readiness:**
   ```bash
   npm run db:readiness
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

The dev server will now automatically check database readiness on startup and warn if tables are missing.

## Prevention

- Dev startup check now includes database readiness validation
- `db:push` automatically regenerates Prisma client
- Clear error messages guide users to fix missing tables
- README documents the sync process

## Notes

- **Development**: Use `db:push` for quick schema sync (no migration files)
- **Production**: Use `db:migrate` to create versioned migrations
- **After pulling changes**: Always run `db:push` or `db:migrate` to sync schema
- **Before starting dev**: Run `db:readiness` to verify tables exist
