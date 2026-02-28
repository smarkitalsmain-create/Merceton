# Performance & Neon

## Database connection (Neon)

- **Use the pooler URL for `DATABASE_URL`** so Prisma uses a single connection per serverless invocation and does not exhaust connections.
- In Neon dashboard: use the **pooled** connection string (e.g. **Connection pooling** with `pgbouncer`).
- Example: `postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Optional: add `?pgbouncer=true&connection_limit=1` if your driver supports it.
- Use `DIRECT_URL` (non-pooled) only for Prisma CLI (migrations, Studio). App runtime uses `DATABASE_URL` only.

## Indexes

The schema already includes indexes on:

- `merchantId`, `createdAt`, `status`, `type` on Orders, LedgerEntry, Payment, PayoutBatch, etc.
- `orderNumber` (Order), `featureKey` (Feature, FeatureAccessLog), `pricingPackageId` (MerchantFeeConfig, PricingPackageFeature).

No additional indexes were added in this pass. If you add new filters (e.g. by `status` + `createdAt`), add a composite index.
