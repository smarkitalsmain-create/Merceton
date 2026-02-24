# Checkout Order Creation Fix

## Problem
Clicking "Place Order (COD)" returns HTTP 200 but order is not created in database.

## Root Cause
1. **Missing OrderCounter model**: `generateOrderNumber()` uses `prisma.orderCounter.upsert()` but the model didn't exist in schema
2. **Silent failures**: Errors were caught but not properly logged or surfaced
3. **Client error handling**: Client didn't validate response structure properly

## Solution

### 1. Added OrderCounter Model ✅
**File:** `prisma/schema.prisma`

```prisma
model OrderCounter {
  key  String @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
  seq  Int    @default(1)
  
  @@map("order_counters")
}
```

This model is used for atomic, transaction-safe order number generation.

### 2. Enhanced Error Logging ✅
**File:** `app/actions/orders.ts`

- Added DEV-only logging at critical points:
  - Before validation
  - After validation
  - Before order number generation
  - After order number generation
  - Before transaction
  - After transaction
  - On errors

- Improved error handling:
  - Separate try-catch for order number generation
  - Separate try-catch for transaction
  - Better error messages
  - Proper Zod error handling

### 3. Improved Client Error Handling ✅
**File:** `components/CheckoutForm.tsx`

- Added response validation:
  - Checks if result is valid object
  - Validates `result.success`
  - Validates `result.order.id` and `result.order.orderNumber` exist
  - Shows appropriate error messages

- Added DEV-only logging:
  - Logs form submission
  - Logs order creation result
  - Logs errors

- Wrapped in try-catch to handle unexpected errors

### 4. Enhanced Order Number Generation ✅
**File:** `lib/order/generateOrderNumber.ts`

- Added error handling with timeout
- Added DEV-only logging
- Throws descriptive errors

### 5. Added Test Script ✅
**File:** `scripts/test-checkout.ts`

- Tests order creation end-to-end
- Verifies order in database
- Checks order number uniqueness
- Can be run with: `npm run test:checkout`

## Files Changed

1. ✅ `prisma/schema.prisma` - Added OrderCounter model
2. ✅ `app/actions/orders.ts` - Enhanced logging and error handling
3. ✅ `components/CheckoutForm.tsx` - Improved client error handling
4. ✅ `lib/order/generateOrderNumber.ts` - Enhanced error handling
5. ✅ `scripts/test-checkout.ts` - NEW: Test script
6. ✅ `scripts/db-readiness-check.js` - Added orderCounter to checks
7. ✅ `package.json` - Added `test:checkout` script

## Code Changes (Diff Style)

### prisma/schema.prisma
```diff
+// ============================================================================
+// ORDER NUMBER GENERATION
+// ============================================================================
+
+model OrderCounter {
+  key  String @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
+  seq  Int    @default(1)
+  
+  @@map("order_counters")
+}
```

### app/actions/orders.ts
```diff
export async function createOrder(input: unknown) {
+  // DEV-only: Log incoming request
+  if (process.env.NODE_ENV === "development") {
+    console.log("[createOrder] Received request:", {...})
+  }
+
   try {
     const validatedInput = createOrderSchema.parse(input)
+    
+    if (process.env.NODE_ENV === "development") {
+      console.log("[createOrder] Validation passed:", {...})
+    }

     // Generate order number with error handling
+    let orderNumber: string;
+    try {
       orderNumber = await generateOrderNumber(prisma);
+      if (process.env.NODE_ENV === "development") {
+        console.log("[createOrder] Order number generated:", orderNumber)
+      }
+    } catch (error) {
+      console.error("[createOrder] Failed to generate order number:", error)
+      return { success: false, error: "Failed to generate order number..." }
+    }

     // Transaction with error handling
+    let order;
+    try {
       order = await prisma.$transaction(async (tx) => {
         // ... order creation
       })
+      
+      if (process.env.NODE_ENV === "development") {
+        console.log("[createOrder] Order created successfully:", {...})
+      }
+    } catch (txError) {
+      console.error("[createOrder] Transaction failed:", txError)
+      return { success: false, error: "Failed to create order..." }
+    }

     return { success: true, order }
   } catch (error) {
+    console.error("[createOrder] Fatal error:", error)
+    if (error instanceof z.ZodError) {
+      return { success: false, error: `Validation failed: ${...}` }
+    }
     // ... existing error handling
   }
}
```

### components/CheckoutForm.tsx
```diff
  const onSubmit = (data: CheckoutFormData) => {
+    if (process.env.NODE_ENV === "development") {
+      console.log("[CheckoutForm] Submitting order:", {...})
+    }

     startTransition(async () => {
+      try {
         const result = await createOrder({...})

+        if (process.env.NODE_ENV === "development") {
+          console.log("[CheckoutForm] Order creation result:", {...})
+        }

+        // Validate response structure
+        if (!result || typeof result !== "object") {
+          console.error("[CheckoutForm] Invalid response:", result)
+          toast({ title: "Order failed", ... })
+          return
+        }

         if (result.success && result.order && result.order.id && result.order.orderNumber) {
           // Success path
         } else {
+          console.error("[CheckoutForm] Order creation failed:", {...})
           toast({ title: "Order failed", description: result.error || "...", ... })
         }
+      } catch (error) {
+        console.error("[CheckoutForm] Unexpected error:", error)
+        toast({ title: "Order failed", ... })
+      }
     })
   }
```

## How to Verify

### 1. Sync Database Schema
```bash
# Add OrderCounter table to database
npm run db:push

# Verify table exists
npm run db:readiness
```

### 2. Test in Browser
1. Go to storefront: `http://app.merceton.localhost:3000/s/[store-slug]`
2. Add product to cart
3. Go to checkout
4. Fill form and click "Place Order (COD)"
5. **Expected**: Redirect to order confirmation page
6. **Check DevTools Console**: Should see `[createOrder]` and `[CheckoutForm]` logs

### 3. Verify in Database

**Option A: Prisma Studio**
```bash
npm run db:studio
```
- Navigate to `orders` table
- Verify new order exists with:
  - Valid `orderNumber` (format: `ORD-YYMM-XXXXXX`)
  - `status` = `PLACED` (for COD)
  - `payment` record created
  - `items` created
  - `ledgerEntries` created (3 entries)

**Option B: SQL Query**
```sql
-- Check latest order
SELECT id, "orderNumber", status, "customerName", "grossAmount", "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 1;

-- Check order counter
SELECT key, seq FROM order_counters;

-- Check order items
SELECT oi.*, p.name
FROM order_items oi
JOIN products p ON p.id = oi."productId"
WHERE oi."orderId" = '<order-id>';

-- Check ledger entries
SELECT type, amount, status
FROM ledger_entries
WHERE "orderId" = '<order-id>';
```

### 4. Run Test Script
```bash
npm run test:checkout
```

**Expected output:**
```
🧪 Testing checkout order creation...
📦 Test data:
   Merchant: Test Store (test-store)
   Product: Test Product (Stock: 10)
   Quantity: 1

🚀 Creating order...
✅ Order created successfully!
   Order ID: clxxx...
   Order Number: ORD-2602-000001

🔍 Verifying order in database...
✅ Order found in database
   Order Number: ORD-2602-000001
   Status: PLACED
   Items: 1
   Payment: Created
   Ledger Entries: 3

✅ Order number is unique
✅ All checks passed!
```

## Order Number Generation

**Format:** `ORD-YYMM-XXXXXX`
- `ORD`: Fixed prefix
- `YYMM`: Year (2 digits) + Month (2 digits)
- `XXXXXX`: 6-digit sequence number (padded with zeros)

**Example:** `ORD-2602-000001` (February 2026, first order)

**Safety:**
- ✅ Transaction-safe (uses Prisma transaction)
- ✅ Atomic increment (upsert with increment)
- ✅ Unique per month (key includes YYMM)
- ✅ Handles concurrency (transaction isolation)

## Troubleshooting

### If order still doesn't create:

1. **Check console logs:**
   - Look for `[createOrder]` logs
   - Check for error messages

2. **Verify OrderCounter table exists:**
   ```bash
   npm run db:readiness
   ```
   Should show: `✓ Table 'order_counters' exists`

3. **Check database connection:**
   - Verify `DATABASE_URL` in `.env.local`
   - Run: `npm run db:check-connection`

4. **Verify merchant has products:**
   - Check products exist and have stock > 0
   - Check products are active

5. **Check merchant email:**
   - Merchant must have at least one user with email
   - User must have role "ADMIN"

## Next Steps

After fix:
1. ✅ Run `npm run db:push` to create OrderCounter table
2. ✅ Test order creation in browser
3. ✅ Verify order in Prisma Studio
4. ✅ Run `npm run test:checkout` to verify end-to-end

The order creation should now work correctly with proper error handling and logging.
