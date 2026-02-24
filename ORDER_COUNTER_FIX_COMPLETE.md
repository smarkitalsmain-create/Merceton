# Order Number Counter Fix - Complete

## Problem
`generateOrderNumber()` throws: "Cannot read properties of undefined (reading 'upsert')" because `prisma.orderCounter` doesn't exist in Prisma client.

## Root Cause
1. Model was named `OrderCounter` but should be `OrderNumberCounter`
2. Field was named `seq` but should be `value`
3. Table was mapped to `order_counters` but should be `order_number_counters`
4. Model missing from database (schema not synced)

## Solution

### Files Changed

1. ✅ `prisma/schema.prisma` - Fixed model name, field name, table mapping
2. ✅ `lib/order/generateOrderNumber.ts` - Updated to use `orderNumberCounter` and `value`
3. ✅ `scripts/repairOrderNumbers.ts` - Updated references
4. ✅ `scripts/backfillOrderNumbers.ts` - Updated references
5. ✅ `scripts/db-readiness-check.js` - Updated model name
6. ✅ `lib/prisma.ts` - Added to required models list

## Exact Code Changes

### 1. prisma/schema.prisma

```diff
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

### 2. lib/order/generateOrderNumber.ts

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

### 3. scripts/repairOrderNumbers.ts

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

### 4. scripts/backfillOrderNumbers.ts

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

### 5. scripts/db-readiness-check.js

```diff
-  { model: "orderCounter", table: "order_counters" },
+  { model: "orderNumberCounter", table: "order_number_counters" },
```

### 6. lib/prisma.ts

```diff
      const requiredModels = [
        "merchant",
        "user",
        "product",
        "order",
        "payment",
        "payoutBatch",
        "merchantOnboarding",
        "platformInvoice",
        "platformBillingProfile",
        "platformSettlementCycle",
        "merchantStoreSettings",
        "merchantBankAccount",
+       "orderNumberCounter",
      ]
```

## Commands to Run

### Step 1: Sync Schema to Database
```bash
# Creates order_number_counters table
npm run db:push
```

### Step 2: Regenerate Prisma Client
```bash
# Ensures Prisma client includes OrderNumberCounter model
npm run db:generate
```

### Step 3: Verify Table Exists
```bash
# Checks that order_number_counters table exists
npm run db:readiness
```

### Step 4: Test Order Creation
```bash
# Test end-to-end order creation
npm run test:checkout
```

## How to Verify

### In Browser
1. Go to storefront checkout page
2. Fill form and click "Place Order (COD)"
3. **Expected**: Order created, redirect to confirmation page
4. **Check DevTools Console**: Should see `[generateOrderNumber]` logs with no errors

### In Database (Prisma Studio)
```bash
npm run db:studio
```
- Navigate to `order_number_counters` table
- Should see entry: `key: "ORD-2602"`, `value: 1` (or higher)

### In Database (SQL)
```sql
-- Check counter table
SELECT key, value, "updatedAt" FROM order_number_counters;

-- Check latest order
SELECT id, "orderNumber", status, "customerName", "grossAmount", "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 1;

-- Verify order number format
SELECT "orderNumber" FROM orders WHERE "orderNumber" LIKE 'ORD-%' LIMIT 5;
```

## Error Handling

**Server Action (`createOrder`):**
- Returns `{ success: false, error: "..." }` on all failures
- Logs errors with context
- Never throws unhandled errors

**Client (`CheckoutForm`):**
- Checks `result.success`
- Validates `result.order.id` and `result.order.orderNumber`
- Shows toast on failure
- Redirects on success

**Note:** Server actions in Next.js always return HTTP 200, but the response body contains `{ success: false }` which the client checks. This is the correct pattern for server actions.

## Expected Behavior

After fix:
- ✅ `generateOrderNumber()` works without errors
- ✅ Order numbers generated: `ORD-YYMM-000001` format
- ✅ Counter increments atomically (transaction-safe)
- ✅ Order creation completes successfully
- ✅ No "Cannot read properties of undefined" errors
- ✅ Proper error logging on failures

## Model Details

- **Model name**: `OrderNumberCounter` (Prisma client: `prisma.orderNumberCounter`)
- **Table name**: `order_number_counters` (snake_case)
- **Fields**:
  - `key` (String @id): Format "ORD-YYMM" (e.g., "ORD-2602")
  - `value` (Int @default(0)): Sequence counter, starts at 0
  - `updatedAt` (DateTime @updatedAt): Auto-updated timestamp
- **Usage**: Atomic increment in transaction for unique order numbers
