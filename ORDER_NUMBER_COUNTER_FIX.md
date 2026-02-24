# Order Number Counter Fix

## Problem
`generateOrderNumber()` throws: "Cannot read properties of undefined (reading 'upsert')" because `prisma.orderCounter` doesn't exist.

## Root Cause
The model was named `OrderCounter` but should be `OrderNumberCounter` with field `value` instead of `seq`, and table `order_number_counters` instead of `order_counters`.

## Solution

### 1. Fixed Schema Model ✅
**File:** `prisma/schema.prisma`

**Changed from:**
```prisma
model OrderCounter {
  key  String @id
  seq  Int    @default(1)
  @@map("order_counters")
}
```

**Changed to:**
```prisma
model OrderNumberCounter {
  key      String   @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
  value    Int      @default(0)
  updatedAt DateTime @updatedAt
  @@map("order_number_counters")
}
```

### 2. Updated generateOrderNumber() ✅
**File:** `lib/order/generateOrderNumber.ts`

- Changed `tx.orderCounter` → `tx.orderNumberCounter`
- Changed `seq` → `value`
- Updated all references

### 3. Updated Repair Scripts ✅
**Files:** 
- `scripts/repairOrderNumbers.ts`
- `scripts/backfillOrderNumbers.ts`

- Changed `prisma.orderCounter` → `prisma.orderNumberCounter`
- Changed `seq` → `value`

### 4. Updated Readiness Check ✅
**File:** `scripts/db-readiness-check.js`

- Changed `orderCounter` → `orderNumberCounter`
- Changed table `order_counters` → `order_number_counters`

### 5. Enhanced Error Handling ✅
**File:** `app/actions/orders.ts`

- Already has proper error handling
- Returns `{ success: false, error }` on failure
- Logs errors with context

## Files Changed

1. ✅ `prisma/schema.prisma` - Renamed model and fields
2. ✅ `lib/order/generateOrderNumber.ts` - Updated to use `orderNumberCounter` and `value`
3. ✅ `scripts/repairOrderNumbers.ts` - Updated references
4. ✅ `scripts/backfillOrderNumbers.ts` - Updated references
5. ✅ `scripts/db-readiness-check.js` - Updated model name
6. ✅ `lib/prisma.ts` - Added `orderNumberCounter` to required models

## Exact Code Changes (Diff Style)

### prisma/schema.prisma
```diff
-// ============================================================================
-// ORDER NUMBER GENERATION
-// ============================================================================
-
-model OrderCounter {
-  key  String @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
-  seq  Int    @default(1)
-  
-  @@map("order_counters")
-}
+// ============================================================================
+// ORDER NUMBER GENERATION
+// ============================================================================
+
+model OrderNumberCounter {
+  key      String   @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
+  value    Int      @default(0)
+  updatedAt DateTime @updatedAt
+  
+  @@map("order_number_counters")
+}
```

### lib/order/generateOrderNumber.ts
```diff
-      const updated = await tx.orderCounter.upsert({
+      const updated = await tx.orderNumberCounter.upsert({
         where: { key },
         update: {
-          seq: {
+          value: {
             increment: 1,
           },
         },
         create: {
           key,
-          seq: 1,
+          value: 1,
         },
         select: {
-          seq: true,
+          value: true,
         },
       });

-      console.log("[generateOrderNumber] Counter updated:", { key, seq: counter.seq })
+      console.log("[generateOrderNumber] Counter updated:", { key, value: counter.value })

-  const orderNumber = `${key}-${String(counter.seq).padStart(6, "0")}`;
+  const orderNumber = `${key}-${String(counter.value).padStart(6, "0")}`;
```

### scripts/repairOrderNumbers.ts
```diff
- * Update OrderCounter table to reflect the highest sequence used
+ * Update OrderNumberCounter table to reflect the highest sequence used
  */
 async function updateOrderCounter(
   prisma: PrismaClient,
-  key: string,
-  seq: number
+  key: string,
+  value: number
 ): Promise<void> {
-  await prisma.orderCounter.upsert({
+  await prisma.orderNumberCounter.upsert({
     where: { key },
     update: {
-      seq: Math.max(seq, 0), // Ensure non-negative
+      value: Math.max(value, 0), // Ensure non-negative
     },
     create: {
       key,
-      seq: Math.max(seq, 0),
+      value: Math.max(value, 0),
     },
   });
 }
```

### scripts/backfillOrderNumbers.ts
```diff
-    const updated = await tx.orderCounter.upsert({
+    const updated = await tx.orderNumberCounter.upsert({
       where: { key },
       update: {
-        seq: {
+        value: {
           increment: 1,
         },
       },
       create: {
         key,
-        seq: 1,
+        value: 1,
       },
       select: {
-        seq: true,
+        value: true,
       },
     });

-  return `${key}-${String(counter.seq).padStart(6, "0")}`;
+  return `${key}-${String(counter.value).padStart(6, "0")}`;
```

### scripts/db-readiness-check.js
```diff
-  { model: "orderCounter", table: "order_counters" },
+  { model: "orderNumberCounter", table: "order_number_counters" },
```

## Commands to Run

### Step 1: Sync Schema to Database
```bash
# This will create the order_number_counters table
npm run db:push
```

### Step 2: Verify Table Exists
```bash
# Check that order_number_counters table exists
npm run db:readiness
```

### Step 3: Regenerate Prisma Client
```bash
# Ensure Prisma client includes OrderNumberCounter model
npm run db:generate
```

### Step 4: Test Order Creation
```bash
# Run test script to verify order creation works
npm run test:checkout
```

## How to Verify

### In Browser
1. Go to storefront checkout
2. Fill form and click "Place Order (COD)"
3. **Expected**: Order created, redirect to confirmation
4. **Check DevTools Console**: Should see `[generateOrderNumber]` logs with no errors

### In Database (Prisma Studio)
```bash
npm run db:studio
```
- Navigate to `order_number_counters` table
- Should see entries like:
  - `key: "ORD-2602"`, `value: 1` (or higher)

### In Database (SQL)
```sql
-- Check order_number_counters table
SELECT key, value, "updatedAt" FROM order_number_counters;

-- Check latest order
SELECT id, "orderNumber", "createdAt" 
FROM orders 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

## Expected Behavior

After fix:
- ✅ `generateOrderNumber()` works without errors
- ✅ Order numbers generated in format: `ORD-YYMM-000001`
- ✅ Counter increments atomically
- ✅ Order creation completes successfully
- ✅ No "Cannot read properties of undefined" errors

## Notes

- **Model name**: `OrderNumberCounter` (camelCase: `orderNumberCounter`)
- **Table name**: `order_number_counters` (snake_case)
- **Field name**: `value` (not `seq`)
- **Default value**: `0` (starts at 0, first order gets 1)
- **Transaction-safe**: Uses Prisma transaction for atomic increment
