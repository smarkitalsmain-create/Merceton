# Database Schema Sync Strategy

## Problem
- `prisma migrate deploy` fails with P3005 (database schema is not empty)
- Runtime fails with P2021: table `public.order_number_counters` does not exist
- Migration history is out of sync with actual database state

## Solution: Dev-Stage Sync Strategy

### For Development (Recommended)

**Use `prisma db push` instead of migrations:**

```bash
# Sync schema to database (creates missing tables, keeps data)
npm run db:push

# OR reset database and sync (DELETES ALL DATA - dev only!)
npm run db:reset
```

**Why `db push` for dev?**
- ✅ Works even when migration history is inconsistent
- ✅ Faster: No migration files to manage
- ✅ Simpler: Direct schema-to-DB sync
- ✅ Safe: Only affects your local/dev database
- ✅ Automatic: Regenerates Prisma client after sync

### Commands Available

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run db:push` | Sync schema to DB (keeps data) | Schema changed, want to keep data |
| `npm run db:reset` | Reset DB and sync (deletes all data) | Want fresh start, or incompatible changes |
| `npm run db:sync` | Alias for `db:push` | Same as `db:push` |
| `npm run db:migrate` | Create migration file | Production or need migration history |
| `npm run db:readiness` | Check table existence | Verify DB is ready |

## Exact Commands to Run

### Step 1: Sync Schema to Database

```bash
# Option A: Sync without wiping data (recommended)
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

## Health Check (Automatic)

The app includes a **dev-only health check** that runs on startup:

1. **Checks if `orderNumberCounter` model exists in Prisma Client**
   - If missing: Logs warning to run `npx prisma generate`

2. **Tests if `order_number_counters` table exists in database**
   - If missing (P2021): Logs clear instructions:
     ```
     [Prisma] ❌ CRITICAL: order_number_counters table does not exist
     [Prisma] To fix, run: npm run db:push
     ```

3. **Non-blocking**: Won't crash app, just warns

## Error Handling

### Checkout Flow

**Server Action (`createOrder`):**
- ✅ Catches order number generation errors
- ✅ Returns `{ success: false, error: "..." }` on failure
- ✅ Logs specific Prisma error codes (P2021, P1001)
- ✅ Provides user-friendly error messages

**Client (`CheckoutForm`):**
- ✅ Checks `result.success`
- ✅ Validates `result.order.id` and `result.order.orderNumber`
- ✅ Shows toast on failure
- ✅ Redirects on success

**Error Codes Handled:**
- `P2021`: Table does not exist → "Database schema is out of sync"
- `P1001`: Database connection error → "Database connection failed"
- Generic: "Failed to generate order number. Please try again."

## Troubleshooting

### Error: P3005 (database schema is not empty)

**Cause:** Migration history is out of sync with database state.

**Solution:**
```bash
# Use db push instead of migrate deploy
npm run db:push
```

### Error: P2021 (table does not exist)

**Cause:** Schema and database are out of sync.

**Solution:**
```bash
# Sync schema to database
npm run db:push

# Then restart dev server
npm run dev
```

### Error: Model missing from Prisma Client

**Cause:** Prisma client not regenerated after schema change.

**Solution:**
```bash
# Regenerate Prisma client
npm run db:generate

# Or use db:push (auto-generates)
npm run db:push
```

### Health Check Shows Table Missing

**What you'll see:**
```
[Prisma] ❌ CRITICAL: order_number_counters table does not exist
[Prisma] To fix, run: npm run db:push
```

**Action:**
```bash
npm run db:push
npm run dev
```

## Production Strategy

**For production, use migrations:**

```bash
# Create migration (dev)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy
```

**Important:** 
- Production should use migrations, not `db push`
- Migrations track schema changes over time
- `db push` is for dev/staging only

## Schema Model Confirmation

**File:** `prisma/schema.prisma`

```prisma
model OrderNumberCounter {
  key      String   @id // Format: "ORD-YYMM" (e.g., "ORD-2602")
  value    Int      @default(0)
  updatedAt DateTime @updatedAt
  
  @@map("order_number_counters")
}
```

**Status:** ✅ Model is correctly defined in schema

## Verification Checklist

After running `npm run db:push`:

- [ ] Migration/DB push completed without errors
- [ ] Prisma client regenerated (`npm run db:generate` output)
- [ ] `npm run db:readiness` shows all tables exist
- [ ] Dev server starts without P2021 errors
- [ ] Health check logs: "✅ Health check passed: order_number_counters table exists"
- [ ] Checkout flow works (order number generated successfully)

## Summary

**For Development:**
1. Use `npm run db:push` to sync schema
2. Health check warns if tables missing
3. Checkout errors are handled gracefully
4. Clear error messages guide fixes

**For Production:**
1. Use `npx prisma migrate deploy` to apply migrations
2. Never use `db push` in production
3. Track schema changes via migration files
