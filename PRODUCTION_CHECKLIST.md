# Production Deployment Checklist

## Pre-Deployment

### ✅ Security
- [x] Rate limiting on public endpoints
- [x] Input validation with Zod
- [x] Tenant isolation verified in all queries
- [x] Error boundaries for graceful error handling
- [x] Admin access via allowlist
- [x] Payment signature verification
- [x] Webhook signature verification

### ✅ Database
- [x] Prisma indexes on all foreign keys
- [x] Tenant isolation indexes
- [x] Migration strategy defined
- [x] Seed script works without manual edits

### ✅ Code Quality
- [x] Logging strategy implemented
- [x] Error handling in place
- [x] Type safety with TypeScript
- [x] Input validation everywhere

### ✅ Documentation
- [x] README with setup instructions
- [x] Environment variables documented
- [x] Deployment steps documented
- [x] Limitations documented

## Deployment Steps

### 1. Environment Variables
Set all required environment variables in Vercel:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_USER_IDS` (optional)

### 2. Database Setup
- Create PostgreSQL database (Vercel Postgres or external)
- Run migrations: `npx prisma migrate deploy`
- Seed database: `npx prisma db seed` (optional)

### 3. External Services
- **Clerk**: Update redirect URLs to production domain
- **Razorpay**: Configure webhook URL
- **Admin**: Add admin user IDs to `ADMIN_USER_IDS`

### 4. Post-Deployment
- Test order creation
- Test payment flow
- Test admin access
- Monitor error logs
- Verify webhook delivery

## Known Limitations

See `LIMITATIONS_AND_NEXT_FEATURES.md` for detailed list.

## Monitoring

- Monitor Vercel deployment logs
- Check database connection health
- Monitor payment webhook delivery
- Track error rates

## Rollback Plan

1. Revert to previous deployment in Vercel
2. Rollback database migrations if needed
3. Update environment variables if changed
