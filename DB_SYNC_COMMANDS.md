# Database Sync - Quick Reference

## Problem
Tables like `platform_invoices` don't exist in database, causing runtime errors.

## Quick Fix (Run These Commands)

### Step 1: Sync Schema to Database
```bash
# Option A: Force reset (deletes all data, then recreates)
npm run db:reset

# Option B: Push schema (creates missing tables, keeps existing data)
npm run db:push
```

### Step 2: Verify Tables Exist
```bash
npm run db:readiness
```

### Step 3: Start Dev Server
```bash
npm run dev
```

## What Was Fixed

1. ✅ **Connection Logging**: Dev server now logs database host/database (password hidden)
2. ✅ **Database Readiness Check**: Checks all 26 critical tables exist
3. ✅ **Scripts Updated**: `db:reset` now uses `db push --force-reset` for dev
4. ✅ **All Models Verified**: All Prisma models in code match schema
5. ✅ **Table Mappings Verified**: All `@@map()` directives correct

## Files Changed

- `lib/prisma.ts` - Added connection logging
- `scripts/db-readiness-check.js` - Enhanced with all models + connection logging
- `package.json` - Updated `db:reset` script

## Expected Result

After running `npm run db:reset` or `npm run db:push`:
- All 26 tables created in database
- `npm run db:readiness` shows all tables exist
- Dev server starts without "table does not exist" errors
- Merchant dashboard, billing pages, admin pages all work
