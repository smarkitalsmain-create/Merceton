# Database Schema Sync Fix - Complete

## Problem Summary
- `prisma migrate deploy` fails with P3005 (database schema is not empty)
- Runtime fails with P2021: table `public.order_number_counters` does not exist
- Migration history is out of sync with actual database state

## Solution Implemented

### 1. Schema Model ✅
**File:** `prisma/schema.prisma`

```prisma
model OrderNumberCounter {
  key      String   @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
  value    Int      @default(0)
  updatedAt DateTime @updatedAt
  
  @@map("order_number_counters")
}
```

**Status:** ✅ Model correctly defined

### 2. Dev-Stage Sync Strategy ✅

**Prefer `prisma db push` over migrations for dev:**

- ✅ Works even when migration history is inconsistent
- ✅ Faster: No migration files to manage
- ✅ Simpler: Direct schema-to-DB sync
- ✅ Automatic: Regenerates Prisma client

### 3. Health Check Added ✅
**File:** `lib/prisma.ts`

- ✅ Dev-only health check on startup
- ✅ Tests `order_number_counters` table existence
- ✅ Logs clear instructions if table missing
- ✅ Non-blocking (won't crash app)

**What you'll see:**
```
[Prisma] ✅ Health check passed: order_number_counters table exists
```

**Or if missing:**
```
[Prisma] ❌ CRITICAL: order_number_counters table does not exist
[Prisma] To fix, run: npm run db:push
```

### 4. Enhanced Error Handling ✅
**File:** `app/actions/orders.ts`

- ✅ Catches P2021 (table does not exist)
- ✅ Catches P1001 (database connection error)
- ✅ Returns user-friendly error messages
- ✅ Logs error codes for debugging

### 5. Updated README ✅
**File:** `README.md`

- ✅ Added "Database Schema Sync" section
- ✅ Clear commands for dev vs production
- ✅ Troubleshooting guide
- ✅ Health check documentation

### 6. New Scripts ✅
**File:** `package.json`

- ✅ `db:push` - Sync schema (keeps data)
- ✅ `db:reset` - Reset DB and sync (deletes data)
- ✅ `db:sync` - Alias for `db:push`

## Exact Commands to Run

### Step 1: Sync Schema to Database

```bash
# Option A: Sync without wiping data (RECOMMENDED)
npm run db:push

# Option B: Reset and sync (DELETES ALL DATA - use with caution!)
npm run db:reset
```

**What this does:**
- Creates missing tables (e.g., `order_number_counters`)
- Updates existing tables to match schema
- Regenerates Prisma client automatically

### Step 2: Verify Database Readiness

```bash
npm run db:readiness
```

**Expected output:**
```
✅ Table 'order_number_counters' exists
✅ Table 'merchants' exists
✅ Table 'orders' exists
...
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C), then:
npm run dev
```

**Check console for:**
```
[Prisma] ✅ Health check passed: order_number_counters table exists
```

## Files Changed

1. ✅ `prisma/schema.prisma` - OrderNumberCounter model defined
2. ✅ `lib/prisma.ts` - Added dev health check for order_number_counters table
3. ✅ `app/actions/orders.ts` - Enhanced error handling (P2021, P1001)
4. ✅ `package.json` - Added `db:sync` alias
5. ✅ `README.md` - Added comprehensive DB sync section
6. ✅ `scripts/db-sync.sh` - New sync script (optional)
7. ✅ `DB_SYNC_STRATEGY.md` - Complete documentation

## Code Changes (Diff Style)

### lib/prisma.ts

```diff
+  // DEV-only: Health check for critical tables (non-blocking)
+  // Tests if orderNumberCounter table exists in database
+  setTimeout(async () => {
+    try {
+      // Check if orderNumberCounter delegate exists
+      if (!(prisma as any).orderNumberCounter) {
+        console.error("[Prisma] ❌ CRITICAL: orderNumberCounter model missing from Prisma Client")
+        console.error("[Prisma] Run: npx prisma generate")
+        return
+      }
+
+      // Attempt a simple query to verify table exists
+      await (prisma as any).orderNumberCounter.findFirst({
+        take: 1,
+      })
+      console.log("[Prisma] ✅ Health check passed: order_number_counters table exists")
+    } catch (error: any) {
+      // P2021 = table does not exist
+      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
+        console.error("[Prisma] ❌ CRITICAL: order_number_counters table does not exist in database")
+        console.error("[Prisma] Schema and database are out of sync!")
+        console.error("[Prisma] To fix, run: npm run db:push")
+      }
+    }
+  }, 2000) // Wait 2 seconds after startup
```

### app/actions/orders.ts

```diff
    } catch (error: any) {
      console.error("[createOrder] Failed to generate order number:", error)
      logger.error("Order number generation failed", {
        merchantId: validatedInput.merchantId,
        error: error instanceof Error ? error.message : String(error),
+       code: error?.code,
      })
      
+     // Check for specific Prisma errors
+     if (error?.code === "P2021") {
+       // Table does not exist
+       console.error("[createOrder] CRITICAL: order_number_counters table missing!")
+       console.error("[createOrder] Run: npm run db:push")
+       return { 
+         success: false, 
+         error: "Database schema is out of sync. Please contact support or try again later." 
+       }
+     }
+     
+     if (error?.code === "P1001") {
+       // Database connection error
+       return { 
+         success: false, 
+         error: "Database connection failed. Please try again later." 
+       }
+     }
+     
      return { success: false, error: "Failed to generate order number. Please try again." }
    }
```

## Verification Steps

### 1. Check Migration Status (Optional)
```bash
npx prisma migrate status
```
**Note:** If migrations are out of sync, use `db:push` instead.

### 2. Verify Table Exists (SQL)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'order_number_counters';
```
**Expected:** Should return `order_number_counters`

### 3. Test Order Creation
1. Start dev server: `npm run dev`
2. Go to checkout page
3. Fill form and click "Place Order (COD)"
4. **Check DevTools Console** for:
   ```
   [Prisma] ✅ Health check passed: order_number_counters table exists
   [generateOrderNumber] Generated order number: ORD-2602-000001
   [createOrder] Order number generated: ORD-2602-000001
   ```
5. **Expected:** Order created successfully, redirect to confirmation

### 4. Verify Order in Database
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

## Expected Behavior

### Before Fix:
- ❌ `prisma migrate deploy` fails with P3005
- ❌ Runtime fails with P2021: table does not exist
- ❌ No clear instructions on how to fix

### After Fix:
- ✅ `npm run db:push` syncs schema successfully
- ✅ Health check warns if table missing on startup
- ✅ Checkout errors are handled gracefully
- ✅ Clear error messages guide fixes
- ✅ Order creation works end-to-end

## Troubleshooting

### If `db:push` fails:
```bash
# Check connection
npm run db:check-connection

# Try with force reset (DELETES DATA!)
npm run db:reset
```

### If health check still shows missing:
1. Verify `npm run db:push` completed successfully
2. Check `npm run db:readiness` output
3. Restart dev server completely
4. Check console for health check logs

### If checkout still fails:
1. Check DevTools Console for error code
2. Verify `order_number_counters` table exists in DB
3. Run `npm run db:readiness` to check all tables
4. Check Prisma client: `npm run db:generate`

## Summary

**Schema:** ✅ OrderNumberCounter model defined correctly  
**Health Check:** ✅ Dev-only startup check for table existence  
**Error Handling:** ✅ Enhanced with P2021/P1001 detection  
**Documentation:** ✅ README updated with sync strategy  
**Commands:** ✅ `db:push` and `db:reset` available  

**Next Steps:**
1. Run `npm run db:push` to sync schema
2. Restart dev server
3. Verify health check passes
4. Test checkout flow

After running these commands, the database schema will be in sync and checkout should work!
