# Sellarity

India-first Shopify-lite multi-tenant SaaS platform where merchants can create storefronts and accept orders. Monetization is per-order (platform fee) deducted from payouts.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Clerk
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
- Clerk account (for authentication)
- Razorpay account (for payments - test mode)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:

- **Clerk Keys**: Get from [Clerk Dashboard](https://dashboard.clerk.com)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

- **Database (Neon Postgres - Free Tier)**:
  1. Go to [Neon.tech](https://neon.tech) and sign up (free tier available)
  2. Create a new project
  3. In the Neon dashboard, you'll see two connection strings:
     - **Pooled connection** (contains `-pooler`) → Use for `DATABASE_URL`
     - **Direct connection** (NO `-pooler`) → Use for `DIRECT_URL`
  4. Add both to `.env.local`:
     ```
     DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
     DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
     ```
  5. **Important**: Both URLs are required for Prisma to work correctly with Neon

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Setup Checklist

1. ✅ Run `npm i` to install dependencies
2. ✅ Create `.env.local` from `.env.example`
3. ✅ Paste Clerk keys from Clerk Dashboard into `.env.local`
4. ✅ Create Neon Postgres database (free tier), copy **both** connection strings:
   - Pooled connection → `DATABASE_URL` (contains `-pooler`)
   - Direct connection → `DIRECT_URL` (NO `-pooler`)
5. ✅ Run: `npx prisma generate`, `npx prisma db push`, `npm run dev`

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
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Verify both URLs in `.env.local`**:
   - `DATABASE_URL` must contain `-pooler`
   - `DIRECT_URL` must NOT contain `-pooler` or `pgbouncer`
   - Both must be wrapped in quotes: `DATABASE_URL="..."`

## Database Migrations

### Initial Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Production Migrations

For production, use Prisma migrations:

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### Schema Changes

After modifying `prisma/schema.prisma`:

1. **Development**: `npm run db:push` (quick, resets data)
2. **Production**: Create migration with `npx prisma migrate dev`

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

### Vercel Postgres Setup

1. In Vercel project, go to Storage tab
2. Click "Create Database" > "Postgres"
3. Copy the connection string to `DATABASE_URL`
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
└── middleware.ts           # Clerk middleware
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm test`: Run tests
- `npm run db:push`: Push Prisma schema to database
- `npm run db:studio`: Open Prisma Studio
- `npm run db:seed`: Seed database with demo data
- `npm run db:generate`: Generate Prisma client

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

### Clerk Authentication Issues

- Verify Clerk keys are correct
- Check redirect URLs in Clerk dashboard
- Ensure environment variables are set

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

## License

MIT
