# Prisma Client Mismatch Fix

## Problem
Prisma client was rejecting `invoiceAddressLine1` and other invoice fields as "Unknown argument" even though they exist in `schema.prisma`. This happens when:
- Prisma client wasn't regenerated after schema changes
- Dev server wasn't restarted after generating client
- Multiple schema files or wrong import paths

## ✅ Solution Implemented

### 1. Verified Single Schema File
- ✅ Only one `prisma/schema.prisma` exists
- ✅ No duplicate schema files found
- ✅ PrismaClient imported correctly from `@prisma/client`

### 2. Added Auto-Generation Scripts

**package.json scripts:**
```json
{
  "postinstall": "prisma generate",  // Auto-generate after npm install
  "prisma:generate": "prisma generate",
  "prisma:reset": "prisma migrate reset --force && prisma generate",
  "prisma:validate": "prisma validate",
  "prisma:verify": "node scripts/verify-prisma-types.js"
}
```

### 3. Created Verification Script

**scripts/verify-prisma-types.js:**
- Checks if generated Prisma client includes invoice fields
- Verifies `MerchantOnboardingCreateInput` and `MerchantOnboardingUpdateInput`
- Reports missing fields with clear error messages

### 4. Updated README

Added clear instructions:
- When to regenerate Prisma client
- How to verify types are correct
- Importance of restarting dev server

## 🚀 Usage

### After Schema Changes

1. **Regenerate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Verify Types:**
   ```bash
   npm run prisma:verify
   ```

3. **Restart Dev Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### After npm install

The `postinstall` script automatically runs `prisma generate`, but you should still verify:

```bash
npm run prisma:verify
```

### If Types Are Missing

1. **Force Regenerate:**
   ```bash
   npm run prisma:generate
   ```

2. **Clear Next.js Cache (if needed):**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Verify Again:**
   ```bash
   npm run prisma:verify
   ```

## ✅ Verification Checklist

After running `npm run prisma:generate`:

- [ ] `npm run prisma:verify` passes
- [ ] TypeScript compiles without errors
- [ ] `prisma.merchantOnboarding.upsert()` accepts invoice fields
- [ ] No "Unknown argument" errors
- [ ] Dev server restarted

## Files Changed

1. **package.json**
   - Added `postinstall` script
   - Added `prisma:generate`, `prisma:reset`, `prisma:validate`, `prisma:verify` scripts

2. **scripts/verify-prisma-types.js** (NEW)
   - Type verification script

3. **README.md**
   - Added Prisma client generation instructions
   - Added verification steps

## Expected Behavior

After fixes:
- ✅ `npm install` automatically generates Prisma client
- ✅ `npm run prisma:verify` confirms all invoice fields are present
- ✅ `prisma.merchantOnboarding.upsert()` accepts all invoice fields
- ✅ No "Unknown argument" errors
- ✅ Types are correctly generated and available

## Troubleshooting

### Still Getting "Unknown argument" Error?

1. **Check if client was generated:**
   ```bash
   ls -la node_modules/@prisma/client/index.d.ts
   ```

2. **Force regenerate:**
   ```bash
   rm -rf node_modules/.prisma
   npm run prisma:generate
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

5. **Verify types:**
   ```bash
   npm run prisma:verify
   ```

### Types Still Missing?

1. **Check schema file:**
   ```bash
   grep -A 10 "Invoice/Billing Address" prisma/schema.prisma
   ```

2. **Validate schema:**
   ```bash
   npm run prisma:validate
   ```

3. **Check for syntax errors in schema:**
   ```bash
   npx prisma format
   ```
