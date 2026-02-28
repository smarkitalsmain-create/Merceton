# Merceton

India-first ecommerce enablement platform where merchants can create storefronts and accept orders. Monetization is per-order (platform fee) deducted from payouts.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Supabase Auth
- **Payments**: Razorpay (Test Mode)
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel + Managed PostgreSQL

## Features

- ✅ Multi-tenant architecture (isolated merchant data)
- ✅ Merchant dashboard for store management
- ✅ Public storefront for customers
- ✅ Order management system
- ✅ Razorpay payment integration (UPI, Card, Netbanking, COD)
- ✅ Per-order platform fee (configurable per merchant)
- ✅ Payout ledger tracking
- ✅ Admin backoffice for platform management

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or managed like [Neon](https://neon.tech))
- Supabase account (for authentication)
- Razorpay account (for payments - test mode)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

**Note:** The `postinstall` script automatically runs `prisma generate` to ensure the Prisma client is up-to-date. If you modify `prisma/schema.prisma`, you must regenerate the client:

```bash
npm run prisma:generate
# OR
npx prisma generate
```

**Important:** After regenerating the Prisma client, restart your dev server:
```bash
# Stop the dev server (Ctrl+C), then:
npm run dev
```

2. **Set up environment variables:**

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:

- **Supabase Keys**: Get from [Supabase Dashboard](https://app.supabase.com)
  - `NEXT_PUBLIC_SUPABASE_URL` (your Supabase project URL)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your Supabase anon/public key)

- **Super Admin Emails** (comma-separated list for admin access):
  - `SUPER_ADMIN_EMAILS="admin@merceton.com,admin2@merceton.com"`

- **Database (Neon Postgres - Free Tier)**:
  1. Go to [Neon.tech](https://neon.tech) and sign up (free tier available)
  2. Create a new project
  3. In the Neon dashboard, you'll see two connection strings:
     - **Pooled connection** (contains `-pooler`) → Use for `DATABASE_URL`
     - **Direct connection** (NO `-pooler`) → Use for `DIRECT_URL` and `SHADOW_DATABASE_URL`
  4. Add all three to `.env.local`:
     ```
     # Used by app runtime (pooled connection for better performance)
     # For Neon pooler, include: ?sslmode=require&pgbouncer=true&connection_limit=1
     DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
     
     # Used for migrations (non-pooled direct connection)
     # Direct connection should NOT include pgbouncer=true
     DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
     
     # Used by Prisma migrate for schema comparison (prevents P3014 errors)
     # For managed Postgres, use the same direct connection URL
     SHADOW_DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
     ```
  5. **Important**: 
     - All three URLs are required for Prisma to work correctly with managed Postgres (Neon/Supabase/RDS)
     - **DATABASE_URL** (pooled): Must include `?sslmode=require&pgbouncer=true&connection_limit=1` for Neon pooler
     - **DIRECT_URL**: Must NOT include `pgbouncer=true` (used for migrations and long transactions)
     - **SHADOW_DATABASE_URL**: Same as DIRECT_URL (used by Prisma migrate)
  6. **Verify connection**: Run `npm run db:check` to test your database connection

3. **Sync Database Schema:**

**IMPORTANT:** After cloning or pulling schema changes, you must sync the database:

**Option A: Development (Recommended for local dev)**
```bash
# Syncs schema directly to database (no migration files)
npm run db:push
```
This will:
- Create any missing tables
- Update existing tables to match schema
- Regenerate Prisma client automatically

**Option B: Production (Use migrations)**
```bash
# Creates a migration file and applies it
npm run db:migrate
```
This will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate Prisma client automatically

**After schema sync, verify database readiness:**
```bash
npm run db:readiness
```
This checks that all critical tables exist and are accessible.

4. **Generate Prisma Client (if not done automatically):**

After installing dependencies or modifying `prisma/schema.prisma`, regenerate the Prisma client:

```bash
npm run prisma:generate
# OR
npx prisma generate
```

**Important:** After regenerating, restart your dev server:
```bash
# Stop dev server (Ctrl+C), then:
npm run dev
```

4. **Verify Prisma Client Types:**

Check if the generated Prisma client includes all schema fields:

```bash
npm run prisma:verify
```

This verifies that invoice fields (`invoiceAddressLine1`, `invoiceCity`, etc.) are present in the generated types.

- **Razorpay Keys** (Test Mode): Get from [Razorpay Dashboard](https://dashboard.razorpay.com)
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET` (optional for local dev)

3. **Set up database:**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# (Optional) Seed database with demo data
npm run db:seed
```

**Note**: If you encounter Prisma errors or white screens, run these reset steps:

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Push schema again
npx prisma db push

# Restart dev server
npm run dev
```

4. **Run development server:**

```bash
npm run dev
```

5. **Access the application via subdomains:**

The app uses hostname-based routing for local development. Open these URLs in your browser:

- **Landing**: [http://merceton.localhost:3000](http://merceton.localhost:3000)
- **Merchant App**: [http://app.merceton.localhost:3000](http://app.merceton.localhost:3000)
- **Admin Panel**: [http://admin.merceton.localhost:3000](http://admin.merceton.localhost:3000)

**Note**: `*.localhost` subdomains resolve automatically in Chrome and most modern browsers. No `/etc/hosts` configuration needed.

### Supabase Auth Configuration

1. **Configure redirect URLs in Supabase Dashboard:**
   - Go to Authentication > URL Configuration
   - Add these redirect URLs:
     - `http://app.merceton.localhost:3000/_app/auth/callback`
     - `http://admin.merceton.localhost:3000/_admin/auth/callback`
     - `http://localhost:3000/auth/callback` (if used elsewhere)

2. **Admin Access:**
   - Admin login is invite-only via `SUPER_ADMIN_EMAILS` environment variable
   - Only emails listed in `SUPER_ADMIN_EMAILS` can access the admin panel
   - App signup is public (anyone can create a merchant account)

### Quick Setup Checklist

1. ✅ Run `npm i` to install dependencies
2. ✅ Create `.env.local` from `.env.example`
3. ✅ Paste Supabase keys from Supabase Dashboard into `.env.local`
4. ✅ Set `SUPER_ADMIN_EMAILS` with your admin email(s)
5. ✅ Create Neon Postgres database (free tier), copy **three** connection strings:
   - Pooled connection → `DATABASE_URL` (contains `-pooler`) - Used by app runtime
   - Direct connection → `DIRECT_URL` (NO `-pooler`) - Used for migrations
   - Direct connection → `SHADOW_DATABASE_URL` (NO `-pooler`) - Used by Prisma migrate (same as DIRECT_URL)
6. ✅ Run: `npm run db:push` (syncs schema to DB), then `npm run dev`
7. ✅ Verify: `npm run db:readiness` (should show all tables exist)
8. ✅ Configure Supabase redirect URLs (see above)
9. ✅ Open `http://app.merceton.localhost:3000` for merchant app

### Localhost Multi-Subdomain Setup

The app uses hostname-based routing for local development:

- **Landing** (`merceton.localhost:3000`) → Public landing page
- **App** (`app.merceton.localhost:3000`) → Merchant dashboard and signup
- **Admin** (`admin.merceton.localhost:3000`) → Admin panel (invite-only)

**How it works:**
- Middleware reads the `Host` header and rewrites routes to `/_site`, `/_app`, or `/_admin`
- Each subdomain has isolated Supabase auth sessions
- Admin and app sessions are independent (you can be logged into both simultaneously)

**Browser Support:**
- Chrome/Edge: `*.localhost` works automatically
- Firefox: `*.localhost` works automatically
- Safari: May require `/etc/hosts` entries (not recommended)

### Troubleshooting: White Screen or Prisma Errors

If you see a white screen on `/dashboard` or `/onboarding/create-store`:

1. **Verify environment variables**:
   ```bash
   # Check if env vars are loaded
   curl http://localhost:3000/api/env-check
   ```
   Should return `{"DATABASE_URL":true,"DIRECT_URL":true,"NODE_ENV":"development"}`

2. **Reset Prisma and Next.js cache**:
   ```bash
   rm -rf .next
   npm run db:push
   npm run dev
   ```

3. **If you see "table does not exist" errors**:
   ```bash
   # Check which tables are missing
   npm run db:readiness
   
   # Sync schema to database
   npm run db:push
   
   # Or if using migrations
   npm run db:migrate
   ```

3. **Verify all three URLs in `.env.local`**:
   - `DATABASE_URL` must contain `-pooler` (used by app runtime)
   - `DIRECT_URL` must NOT contain `-pooler` or `pgbouncer` (used for migrations)
   - `SHADOW_DATABASE_URL` must NOT contain `-pooler` (used by Prisma migrate, can be same as DIRECT_URL)
   - All must be wrapped in quotes: `DATABASE_URL="..."`
   - **Note**: For managed Postgres, `SHADOW_DATABASE_URL` prevents P3014 migration errors

## Database Schema Sync

### Development Strategy (Recommended)

**For local/dev environments, use `prisma db push` instead of migrations:**

```bash
# Sync schema to database (creates/updates tables, keeps data)
npm run db:push

# OR reset database and sync (DELETES ALL DATA - dev only!)
npm run db:reset
```

**Why `db push` for dev?**
- Faster: No migration files to manage
- Simpler: Direct schema-to-DB sync
- Safe: Only affects your local/dev database
- Automatic: Regenerates Prisma client after sync

### When to Use Each Command

**`npm run db:push` (Sync without wipe)**
- Use when: Schema changed, want to keep existing data
- Creates missing tables (e.g., `order_number_counters`)
- Updates existing tables to match schema
- **Safe for dev databases with data**

**`npm run db:reset` (Reset & sync)**
- Use when: Want to start fresh, or schema changes are incompatible
- **WARNING: DELETES ALL DATA** in database
- Resets database, then syncs schema
- Useful for testing or after major schema changes

**`npm run db:migrate` (Production migrations)**
- Use when: Working with production or need migration history
- Creates migration files in `prisma/migrations/`
- Tracks schema changes over time
- Required for production deployments

### Troubleshooting Schema Sync Issues

**Error: P3005 (database schema is not empty)**
- This means migration history is out of sync
- **Solution for dev:** Use `npm run db:push` instead of `prisma migrate deploy`
- `db push` works even when migration history is inconsistent

**Error: P2021 (table does not exist)**
- Schema and database are out of sync
- **Solution:** Run `npm run db:push` to sync schema to database
- Then restart dev server: `npm run dev`

**Error: Model missing from Prisma Client**
- Prisma client needs regeneration
- **Solution:** Run `npm run db:generate` or `npm run db:push` (auto-generates)

### Health Check

The app includes a dev-only health check that:
- Verifies `order_number_counters` table exists on startup
- Logs clear instructions if table is missing
- Non-blocking (won't crash app, just warns)

**Check database readiness manually:**
```bash
npm run db:readiness
```

### Production Migrations

For production, use Prisma migrations:

```bash
# Create migration (dev)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy
```

**Important:** Production should use migrations, not `db push`, to track schema changes.

## Razorpay Webhook Setup

### Local Testing (with ngrok)

1. **Install ngrok:**
   ```bash
   brew install ngrok  # macOS
   # Or download from https://ngrok.com
   ```

2. **Start your app:**
   ```bash
   npm run dev
   ```

3. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Configure in Razorpay:**
   - Go to Razorpay Dashboard > Settings > Webhooks
   - Add webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`
   - Select events: `payment.captured`, `payment.failed`
   - Copy the webhook secret to `.env` as `RAZORPAY_WEBHOOK_SECRET`

### Production Setup

1. **Get production Razorpay keys** from Razorpay Dashboard
2. **Update environment variables** with production keys
3. **Configure webhook in Razorpay:**
   - URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`
   - Copy webhook secret to production environment

## Deployment to Vercel

### Prerequisites

- GitHub account
- Vercel account
- PostgreSQL database (Vercel Postgres or external)

### Steps

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import project in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure environment variables:**
   - In Vercel project settings, add all environment variables from `.env`
   - **Important**: Use production values for:
     - `DATABASE_URL` (Vercel Postgres connection string)
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production key)
     - `CLERK_SECRET_KEY` (production key)
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (production key)
     - `RAZORPAY_KEY_SECRET` (production key)
     - `RAZORPAY_WEBHOOK_SECRET` (production webhook secret)
     - `NEXT_PUBLIC_APP_URL` (your production domain)

4. **Configure build settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

6. **Post-deployment:**
   ```bash
   # Run migrations
   npx prisma migrate deploy
   
   # Or if using db:push
   npx prisma db push
   
   # Seed database (optional)
   npx prisma db seed
   ```

7. **Configure external services:**
   - **Clerk**: Update redirect URLs in Clerk dashboard to your production domain
   - **Razorpay**: Configure webhook URL to `https://yourdomain.com/api/webhooks/razorpay`
   - **Admin Access**: Add your Clerk user ID to `ADMIN_USER_IDS` in Vercel environment variables

### Vercel / Neon env guidance

- **DATABASE_URL** must be the **Neon pooled** connection string (host contains `-pooler`). This is used by the app at runtime; using the non-pooled URL in production can exhaust connections.
- **DIRECT_URL** must be the **non-pooled** (direct) connection string. Used only by Prisma CLI for migrations and Studio, not by the app.
- After changing any of these in Vercel (or elsewhere), **redeploy** so the new values are picked up.

### Vercel Postgres Setup

1. In Vercel project, go to Storage tab
2. Click "Create Database" > "Postgres"
3. Copy the **pooled** connection string to `DATABASE_URL` and the **direct** connection string to `DIRECT_URL`
4. Run migrations: `npx prisma migrate deploy`

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/              # Admin backoffice
│   ├── dashboard/          # Merchant dashboard
│   ├── s/                  # Public storefront
│   ├── api/                # API routes
│   │   ├── admin/          # Admin API
│   │   ├── payments/       # Payment endpoints
│   │   └── webhooks/        # Webhook handlers
│   ├── actions/            # Server actions
│   └── layout.tsx          # Root layout
├── components/              # React components
│   ├── admin/              # Admin components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utility functions
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Auth helpers
│   ├── admin.ts            # Admin helpers
│   ├── fees.ts             # Fee calculation
│   ├── razorpay.ts         # Razorpay integration
│   ├── rate-limit.ts       # Rate limiting
│   ├── logger.ts           # Logging
│   └── validations/        # Zod schemas
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
├── __tests__/              # Tests
└── middleware.ts           # Supabase auth + hostname routing middleware
```

## Available Scripts

- `npm run dev`: Start development server (runs pre-flight checks)
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm test`: Run tests
- `npm run db:push`: Push Prisma schema to database + regenerate client (dev)
- `npm run db:migrate`: Create migration + apply + regenerate client (prod)
- `npm run db:reset`: Reset database (WARNING: deletes all data) + regenerate client
- `npm run db:readiness`: Check if all critical tables exist
- `npm run db:studio`: Open Prisma Studio (database GUI)
- `npm run db:seed`: Seed database with demo data
- `npm run db:generate`: Generate Prisma client only
- `npm run db:status`: Check migration status

## Security Features

- ✅ Multi-tenant data isolation (all queries scoped by merchantId)
- ✅ Server-side authentication and authorization
- ✅ Rate limiting on public endpoints
- ✅ Input validation with Zod
- ✅ Razorpay webhook signature verification
- ✅ Payment signature verification
- ✅ Error boundaries for graceful error handling
- ✅ Admin access via allowlist

## Performance

- ✅ Database indexes on all foreign keys and frequently queried fields
- ✅ Tenant isolation indexes for fast queries
- ✅ Optimized Prisma queries with proper includes
- ✅ Server-side rendering for dashboard pages

## Testing

Basic tests are included:

```bash
npm test
```

Tests cover:
- Fee calculation edge cases
- Input validation
- API route functionality

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure SSL is configured if required

### Supabase Authentication Issues

- Verify Supabase keys are correct (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Check redirect URLs in Supabase dashboard (must include `/_app/auth/callback` and `/_admin/auth/callback`)
- Ensure `SUPER_ADMIN_EMAILS` is set for admin access
- Verify you're accessing the correct subdomain (`app.merceton.localhost` vs `admin.merceton.localhost`)

### Razorpay Payment Issues

- Verify Razorpay keys are correct (test vs production)
- Check webhook configuration
- Verify webhook secret matches

### Seed Script Issues

- Ensure database is set up (`npm run db:push`)
- Check that Clerk user exists before seeding
- Verify environment variables are set

## Support

For issues and questions:
- Check the documentation in `/docs` folder
- Review error logs in console
- Check Vercel deployment logs

## Running tests locally

### Test database

- Point `DATABASE_URL` to a dedicated **test** database when running tests.
- Run migrations before tests:

```bash
npm run db:migrate
```

### Unit & integration tests (Vitest)

```bash
npm run test:unit
```

These cover:
- `generateOrderNumber`
- `allocatePlatformInvoiceNumber`
- core email notification helpers (with mocked email sender)

### End-to-end tests (Playwright)

```bash
npm run test:e2e
```

Notes:
- Tests assume a dev server is running on `http://localhost:3000` (`npm run dev`).
- Some auth-dependent flows are scaffolded with `test.skip` and can be wired up once test credentials are available.

### System smoke tests

Backend-only smoke:

```bash
npm run smoke:system
```

Deep smoke (unit + integration + E2E):

```bash
npm run deep-smoke
```

CI-friendly full check:

```bash
npm run check:full
```

## License

MIT
