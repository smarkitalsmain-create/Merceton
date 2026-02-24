# Order Number Repair Guide

This guide helps fix duplicate `orderNumber` values and restore the unique constraint.

## Problem
The `orderNumber` field has duplicate values, preventing the `@unique` constraint from being applied.

## Solution Steps

### Step 1: Temporarily Remove Uniqueness Constraint ✅
**Status**: Already done in `schema.prisma`
- Changed: `orderNumber String @unique`
- To: `orderNumber String?` (temporarily optional, no uniqueness)

### Step 2: Apply Schema Without Uniqueness
```bash
npx prisma db push
```

This applies the schema change without the unique constraint, allowing us to fix duplicates.

### Step 3: Run Repair Script
```bash
npx tsx scripts/repairOrderNumbers.ts
# OR
npx ts-node scripts/repairOrderNumbers.ts
```

**What the script does:**
- Fetches all orders sorted by `createdAt` (ascending)
- Regenerates order numbers sequentially using format: `ORD-YYMM-000001`
- Resets sequence per month (YYMM)
- Fixes duplicates by assigning new unique numbers
- Updates `OrderCounter` table to reflect highest sequence used
- Logs progress and summary statistics

**Script features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Preserves valid order numbers when possible
- ✅ Overwrites duplicates safely
- ✅ Updates OrderCounter for future order creation

### Step 4: Re-add Uniqueness Constraint

After the repair script completes successfully:

1. **Edit `prisma/schema.prisma`**:
   ```prisma
   // Change this line:
   orderNumber     String? // Temporarily optional...
   
   // To this:
   orderNumber     String @unique
   ```

2. **Create and apply migration**:
   ```bash
   npx prisma migrate dev --name enforce_order_number_unique
   ```

   This will:
   - Create a migration that adds the unique constraint
   - Apply it to the database
   - Generate the Prisma client

### Step 5: Verify

Verify that all orders have unique order numbers:

```sql
-- Check for duplicates (should return 0 rows)
SELECT orderNumber, COUNT(*) as count
FROM orders
WHERE orderNumber IS NOT NULL
GROUP BY orderNumber
HAVING COUNT(*) > 1;
```

Or using Prisma Studio:
```bash
npx prisma studio
```

## Troubleshooting

### If repair script fails:
- Check database connection
- Ensure `OrderCounter` table exists
- Verify orders table is accessible

### If migration fails after repair:
- Re-run repair script to ensure all duplicates are fixed
- Check for NULL orderNumber values (should be none after repair)
- Verify database connection

### If you need to rollback:
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back enforce_order_number_unique

# Re-run repair if needed
npx tsx scripts/repairOrderNumbers.ts
```

## Notes

- The repair script processes orders in chronological order (by `createdAt`)
- Order numbers are regenerated sequentially per month
- Valid existing order numbers are preserved when possible
- The script updates `OrderCounter` to prevent future conflicts
