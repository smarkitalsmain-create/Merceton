# Prisma Schema & Database Sync - Complete Fix

## Problem
Prisma schema and database were out of sync. Error: `The column merchant_onboarding.invoiceAddressLine1 does not exist.`

## Root Cause
- Invoice fields were added to `schema.prisma` but migration wasn't applied to database
- Fields were marked as required (String) causing create failures
- No checks to prevent schema/database drift

## ✅ Complete Fix Applied

### 1. Made Invoice Fields Optional in Schema

**prisma/schema.prisma:**
- Changed all invoice fields from `String` (required) to `String?` (optional)
- Allows onboarding record creation before invoice step
- Validation enforced at UI/validation layer, not database level

**Before:**
```prisma
invoiceAddressLine1 String   // Required
invoiceCity         String   // Required
invoicePincode      String   // Required
invoiceState        String   // Required
```

**After:**
```prisma
invoiceAddressLine1 String?  // Optional, validated at UI level
invoiceCity         String?  // Optional, validated at UI level
invoicePincode      String?  // Optional, validated at UI level
invoiceState        String?  // Optional, validated at UI level
```

### 2. Updated Migration SQL

**prisma/migrations/20260222144321_add_invoice_fields_to_onboarding/migration.sql:**
- Removed NOT NULL constraints
- All fields are nullable
- Uses `IF NOT EXISTS` for idempotency

### 3. Fixed Onboarding Create Logic

**lib/onboarding.ts:**
- Removed empty string defaults for invoice fields
- Creates minimal record with only `merchantId`, `onboardingStatus`, `profileCompletionPercent`
- Invoice fields are populated only when user submits invoice step

**Before:**
```typescript
create: {
  merchantId,
  onboardingStatus: "NOT_STARTED",
  invoiceAddressLine1: "",  // ❌ Empty strings for required fields
  invoiceCity: "",
  invoicePincode: "",
  invoiceState: "",
}
```

**After:**
```typescript
create: {
  merchantId,
  onboardingStatus: "NOT_STARTED",
  profileCompletionPercent: 0,
  // Invoice fields omitted - will be populated during invoice step
}
```

### 4. Added Database Sync Scripts

**package.json scripts:**
```json
{
  "db:migrate": "prisma migrate dev",
  "db:status": "prisma migrate status",
  "db:check": "prisma validate && prisma migrate status",
  "db:sync-check": "node scripts/check-db-sync.js"
}
```

**scripts/check-db-sync.js** (NEW):
- Validates Prisma schema
- Checks migration status
- Verifies Prisma client is generated
- Checks for invoice fields in generated types
- Provides clear error messages and next steps

**scripts/dev-startup-check.js** (NEW):
- Runs before dev server starts
- Validates schema
- Checks migration status (non-blocking)
- Warns if issues detected

### 5. Updated Dev Script

**package.json:**
```json
{
  "dev": "node scripts/dev-startup-check.js && next dev"
}
```

Dev server now runs pre-startup checks automatically.

## 🚀 Steps to Apply Fix

### Step 1: Regenerate Prisma Client

```bash
npm run prisma:generate
```

### Step 2: Create and Apply Migration

```bash
npm run db:migrate
# OR
npx prisma migrate dev --name add_invoice_fields_to_merchant_onboarding
```

**Important:** This will:
- Create migration SQL file
- Apply migration to database (uses DIRECT_URL for migrations)
- Regenerate Prisma client

### Step 3: Verify Migration Applied

```bash
npm run db:status
```

Should show: "Database schema is up to date"

### Step 4: Verify Database Columns

```bash
# Option 1: Check via Prisma Studio
npm run db:studio
# Navigate to merchant_onboarding table and verify invoice columns exist

# Option 2: Check via SQL
# Connect to your database and run:
# SELECT column_name FROM information_schema.columns 
# WHERE table_name = 'merchant_onboarding' AND column_name LIKE 'invoice%';
```

### Step 5: Restart Dev Server

```bash
npm run dev
```

The startup check will run automatically and verify everything is in sync.

## ✅ Verification Checklist

After applying fix:

- [ ] `npm run db:sync-check` passes
- [ ] `npm run db:status` shows "Database schema is up to date"
- [ ] Prisma Studio shows `invoiceAddressLine1`, `invoiceCity`, etc. in `merchant_onboarding` table
- [ ] `npm run dev` starts without errors
- [ ] Onboarding page loads without "column does not exist" errors
- [ ] Can create onboarding record without invoice fields
- [ ] Can update invoice fields when user submits invoice step

## 🔒 Preventing Future Drift

### When Schema Changes

1. **Always run migration:**
   ```bash
   npm run db:migrate
   ```

2. **Verify sync:**
   ```bash
   npm run db:sync-check
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Automated Checks

- **On npm install:** `postinstall` script auto-generates Prisma client
- **On dev start:** `dev-startup-check.js` validates schema and checks migrations
- **Manual check:** `npm run db:sync-check` for comprehensive verification

## 📋 Files Changed

1. **prisma/schema.prisma**
   - Made all invoice fields optional (String?)

2. **prisma/migrations/20260222144321_add_invoice_fields_to_onboarding/migration.sql**
   - Updated to add nullable columns only
   - Removed NOT NULL constraints

3. **lib/onboarding.ts**
   - Removed invoice fields from create data
   - Creates minimal record only

4. **package.json**
   - Added `db:migrate`, `db:status`, `db:sync-check` scripts
   - Updated `dev` script to run startup checks

5. **scripts/check-db-sync.js** (NEW)
   - Comprehensive database sync verification

6. **scripts/dev-startup-check.js** (NEW)
   - Pre-startup validation

## 🎯 Expected Behavior

### Onboarding Record Creation
- ✅ Can create onboarding record without invoice fields
- ✅ Record created with `merchantId`, `onboardingStatus`, `profileCompletionPercent`
- ✅ Invoice fields are `null` initially

### Invoice Step Submission
- ✅ User fills invoice form
- ✅ Validation happens at UI level (Zod schema)
- ✅ Update query includes invoice fields
- ✅ Fields are saved to database

### Error Prevention
- ✅ No "column does not exist" errors
- ✅ No "Unknown argument" errors
- ✅ Schema and database stay in sync

## Troubleshooting

### Migration Fails

1. **Check DATABASE_URL and DIRECT_URL:**
   ```bash
   # In .env.local, ensure:
   DATABASE_URL="postgresql://...pooler...?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://...direct...?sslmode=require"  # NO pgbouncer
   ```

2. **Check migration status:**
   ```bash
   npm run db:status
   ```

3. **Reset if needed (WARNING: deletes data):**
   ```bash
   npm run prisma:reset
   ```

### Still Getting "Column Does Not Exist"

1. **Verify migration applied:**
   ```bash
   npm run db:status
   ```

2. **Check database directly:**
   ```bash
   npm run db:studio
   ```

3. **Re-apply migration:**
   ```bash
   npm run db:migrate
   ```

### Schema Validation Fails

1. **Format schema:**
   ```bash
   npx prisma format
   ```

2. **Validate:**
   ```bash
   npm run prisma:validate
   ```

## Summary

All fixes are complete:
- ✅ Invoice fields are optional in schema
- ✅ Migration adds nullable columns
- ✅ Onboarding create doesn't require invoice fields
- ✅ Scripts prevent future drift
- ✅ Startup checks validate sync

Run `npm run db:migrate` to apply the migration and sync your database!
