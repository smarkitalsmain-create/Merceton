# Production migrations (Neon / production DB)

**Constraint:** DB is production. Do **not** run `prisma migrate dev` or any destructive commands (reset, drop) against production.

## Safe command sequence

1. **Generate migrations locally** (against a local or dev copy of the DB only):
   - Use a local Postgres or Neon branch to run `npx prisma migrate dev --name <name>` so migration SQL files are created and committed.

2. **Apply on production:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Verify:**
   - `GET /api/health` should return 200 (and checks that `tickets` table exists).
   - Run app and confirm new tables/columns are used without errors.

## Pre-migration safety (optional)

For migrations that add unique constraints (e.g. `merchants.customDomain`), run a read-only check first to detect duplicates:

```sql
SELECT "customDomain", COUNT(*) FROM merchants WHERE "customDomain" IS NOT NULL GROUP BY "customDomain" HAVING COUNT(*) > 1;
```

Resolve duplicates before applying the migration that adds the unique constraint.

## Migrations included

- `20260224180000_add_ticketing` – creates `tickets`, `ticket_messages`, `ticket_internal_notes` and enums.
- `20260224190000_billing_profile_fields` – adds optional columns to `platform_billing_profile` (gstin, addressLine1, addressLine2, city, state, pincode, email, phone, footerNote).
