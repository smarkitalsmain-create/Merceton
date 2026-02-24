# Order Number Counter Migration Steps

## Problem
`generateOrderNumber()` fails with: "Cannot read properties of undefined (reading 'upsert')" because `prisma.orderNumberCounter` doesn't exist in the Prisma client.

## Solution Applied

### 1. Schema Model ✅
**File:** `prisma/schema.prisma` (lines 774-780)

```prisma
model OrderNumberCounter {
  key      String   @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
  value    Int      @default(0)
  updatedAt DateTime @updatedAt
  
  @@map("order_number_counters")
}
```

**Status:** ✅ Model is correctly defined in schema

### 2. Code Updated ✅
**File:** `lib/order/generateOrderNumber.ts`

- ✅ Uses `tx.orderNumberCounter.upsert(...)`
- ✅ Uses `value` field (not `seq`)
- ✅ Added sanity log to verify delegate exists

**Sanity Log Added:**
```typescript
console.log("[generateOrderNumber] Counter delegate exists:", !!prisma.orderNumberCounter)
console.log("[generateOrderNumber] Available models:", Object.keys(prisma).filter(...))
```

### 3. Migration Required ⚠️

**You need to run these commands manually:**

```bash
# Step 1: Create and apply migration
npx prisma migrate dev --name add_order_number_counters

# Step 2: Regenerate Prisma client (includes OrderNumberCounter)
npx prisma generate

# Step 3: Verify migration status
npx prisma migrate status
```

**Alternative (if migrations are messy):**
```bash
# Push schema directly to DB (dev only)
npx prisma db push

# Then generate client
npx prisma generate
```

### 4. Restart Dev Server ⚠️

**After migration and generate:**
```bash
# Stop current dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Verification Steps

### 1. Check Migration Applied
```bash
npx prisma migrate status
```
**Expected:** Should show migration `add_order_number_counters` as applied

### 2. Check Table Exists (SQL)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'order_number_counters';
```
**Expected:** Should return `order_number_counters`

### 3. Check Prisma Client Generated
```bash
# Check if model exists in generated client
grep -r "orderNumberCounter" node_modules/.prisma/client/index.d.ts
```
**Expected:** Should find `orderNumberCounter` delegate

### 4. Test Order Creation
1. Start dev server: `npm run dev`
2. Go to checkout page
3. Fill form and click "Place Order (COD)"
4. **Check DevTools Console** for logs:
   ```
   [generateOrderNumber] Generating for key: ORD-2602
   [generateOrderNumber] Counter delegate exists: true
   [generateOrderNumber] Available models: ..., orderNumberCounter, ...
   [generateOrderNumber] Counter updated: { key: 'ORD-2602', value: 1 }
   [generateOrderNumber] Generated order number: ORD-2602-000001
   [createOrder] Order number generated: ORD-2602-000001
   [createOrder] Starting transaction to create order...
   ```
5. **Expected:** Order created successfully, redirect to confirmation

### 5. Verify Order in Database
```sql
-- Check latest order
SELECT id, "orderNumber", status, "customerName", "grossAmount", "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 1;

-- Check counter table
SELECT key, value, "updatedAt" 
FROM order_number_counters;
```

## Expected Behavior After Fix

✅ **Before Migration:**
- `prisma.orderNumberCounter` is `undefined`
- Error: "Cannot read properties of undefined (reading 'upsert')"
- Order creation fails at number generation

✅ **After Migration:**
- `prisma.orderNumberCounter` exists
- Sanity log shows: `Counter delegate exists: true`
- Order number generated: `ORD-YYMM-000001`
- Order created successfully
- Counter table has entry: `key: "ORD-2602"`, `value: 1`

## Troubleshooting

### If migration fails:
```bash
# Check if table already exists
npx prisma db pull

# If table exists but migration fails, mark as applied:
npx prisma migrate resolve --applied add_order_number_counters
```

### If Prisma client still missing model:
```bash
# Force regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### If dev server still shows error:
1. Stop dev server completely
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev`

## Files Changed

1. ✅ `prisma/schema.prisma` - OrderNumberCounter model defined
2. ✅ `lib/order/generateOrderNumber.ts` - Uses orderNumberCounter, added sanity log
3. ✅ All scripts updated (repairOrderNumbers.ts, backfillOrderNumbers.ts)
4. ✅ db-readiness-check.js updated

## Summary

**Schema:** ✅ Correct
**Code:** ✅ Correct  
**Migration:** ⚠️ **YOU MUST RUN:** `npx prisma migrate dev --name add_order_number_counters`
**Generate:** ⚠️ **YOU MUST RUN:** `npx prisma generate`
**Restart:** ⚠️ **YOU MUST RESTART:** dev server

After running these commands, checkout should work!
