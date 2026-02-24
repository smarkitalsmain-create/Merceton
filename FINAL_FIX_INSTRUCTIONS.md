# Final Fix Instructions - Prisma Schema & Database Sync

## ✅ All Changes Applied

The following fixes have been implemented:

1. ✅ Invoice fields made optional in schema (String?)
2. ✅ Migration SQL updated to add nullable columns
3. ✅ Onboarding create logic fixed (no invoice fields required)
4. ✅ Database sync scripts added
5. ✅ Startup checks added

## 🚀 Apply the Fix (Run These Commands)

### Step 1: Regenerate Prisma Client

```bash
npm run prisma:generate
```

### Step 2: Create and Apply Migration

```bash
npm run db:migrate
```

This will:
- Create migration file (if not exists)
- Apply migration to database (adds invoice columns)
- Regenerate Prisma client

**Note:** If migration already exists, it will just apply it. If you get an error about migration already applied, you can mark it as applied:

```bash
npx prisma migrate resolve --applied 20260222144321_add_invoice_fields_to_onboarding
```

### Step 3: Verify Migration Applied

```bash
npm run db:status
```

Should show: "Database schema is up to date"

### Step 4: Verify Database Sync

```bash
npm run db:sync-check
```

This comprehensive check verifies:
- Schema is valid
- Migrations are applied
- Prisma client is generated
- Invoice fields are present

### Step 5: Start Dev Server

```bash
npm run dev
```

The startup check will run automatically and verify everything is in sync.

## ✅ Verification

After running the commands above:

1. **Check migration status:**
   ```bash
   npm run db:status
   ```
   Should show: "Database schema is up to date"

2. **Verify columns exist:**
   ```bash
   npm run db:studio
   ```
   Navigate to `merchant_onboarding` table and verify these columns exist:
   - `invoiceAddressLine1`
   - `invoiceAddressLine2`
   - `invoiceCity`
   - `invoicePincode`
   - `invoicePhone`
   - `invoiceEmail`
   - `invoicePrefix`
   - `invoiceState`

3. **Test onboarding:**
   - Navigate to onboarding page
   - Should load without "column does not exist" errors
   - Can create onboarding record
   - Can submit invoice step with fields

## 📋 Files Changed Summary

1. **prisma/schema.prisma**
   - All invoice fields changed to optional (String?)

2. **prisma/migrations/20260222144321_add_invoice_fields_to_onboarding/migration.sql**
   - Updated to add nullable columns only

3. **lib/onboarding.ts**
   - Removed invoice fields from create data

4. **package.json**
   - Added `db:migrate`, `db:status`, `db:sync-check` scripts
   - Updated `dev` script to run startup checks

5. **scripts/check-db-sync.js** (NEW)
   - Comprehensive database sync verification

6. **scripts/dev-startup-check.js** (NEW)
   - Pre-startup validation

## 🎯 Expected Results

After applying the fix:

- ✅ No "column does not exist" errors
- ✅ Onboarding record can be created without invoice fields
- ✅ Invoice fields can be updated when user submits invoice step
- ✅ Schema and database stay in sync
- ✅ Startup checks prevent future drift

## 🔧 Troubleshooting

### Migration Already Exists Error

If you get an error that migration already exists:

```bash
# Check migration status
npm run db:status

# If migration is pending, apply it:
npx prisma migrate deploy

# If migration is already applied but Prisma thinks it's not:
npx prisma migrate resolve --applied 20260222144321_add_invoice_fields_to_onboarding
```

### Columns Still Don't Exist

1. **Check if migration was applied:**
   ```bash
   npm run db:status
   ```

2. **Manually check database:**
   ```bash
   npm run db:studio
   ```

3. **Re-run migration:**
   ```bash
   npm run db:migrate
   ```

### DATABASE_URL Issues

Ensure `.env.local` has:
```
DATABASE_URL="postgresql://...pooler...?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://...direct...?sslmode=require"
```

**Important:** 
- `DATABASE_URL` should use pooler (for runtime)
- `DIRECT_URL` should NOT use pooler (for migrations)

## Summary

All code changes are complete. You just need to:

1. Run `npm run db:migrate` to apply the migration
2. Verify with `npm run db:sync-check`
3. Start dev server with `npm run dev`

The fix ensures schema and database stay in sync going forward!
