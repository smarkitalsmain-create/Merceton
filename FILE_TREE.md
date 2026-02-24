# Merceton Project File Tree

## Project Structure

```
merceton/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── merchant/
│   │   │   └── setup/
│   │   │       └── route.ts      # Merchant store setup endpoint
│   │   ├── orders/
│   │   │   └── create/
│   │   │       └── route.ts      # Order creation endpoint
│   │   └── payments/
│   │       ├── create-order/
│   │       │   └── route.ts      # Razorpay order creation
│   │       └── verify/
│   │           └── route.ts      # Payment verification
│   ├── dashboard/                # Merchant Dashboard
│   │   ├── layout.tsx            # Dashboard layout with auth
│   │   ├── page.tsx              # Dashboard home (stats)
│   │   └── setup/
│   │       └── page.tsx          # Store setup page
│   ├── store/                    # Public Storefront
│   │   └── [slug]/               # Dynamic store routes
│   │       ├── page.tsx          # Store catalog page
│   │       ├── product/
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Product detail page
│   │       └── order/
│   │           └── [orderId]/
│   │               └── payment/
│   │                   └── page.tsx  # Payment page
│   ├── globals.css               # Global styles (Tailwind)
│   ├── layout.tsx                # Root layout (Clerk provider)
│   └── page.tsx                  # Landing page
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── PaymentForm.tsx           # Razorpay payment form
│   ├── ProductPurchaseForm.tsx   # Order form
│   └── StoreSetupForm.tsx        # Merchant setup form
│
├── lib/                          # Utility Libraries
│   ├── auth.ts                   # Clerk auth helpers
│   ├── prisma.ts                 # Prisma client singleton
│   ├── razorpay.ts               # Razorpay integration
│   └── utils.ts                  # Utility functions (cn)
│
├── prisma/                       # Database Schema
│   ├── schema.prisma             # Prisma schema (multi-tenant)
│   └── seed.ts                   # Database seed script
│
├── __tests__/                    # Tests
│   └── api.test.ts               # Basic API tests
│
├── .env.example                   # Environment variables template
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git ignore rules
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Jest setup file
├── middleware.ts                 # Clerk middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies & scripts
├── postcss.config.js             # PostCSS configuration
├── README.md                     # Project documentation
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Key Files Explained

### Core Application Files

1. **`app/layout.tsx`** - Root layout with ClerkProvider for authentication
2. **`app/page.tsx`** - Landing page with links to dashboard and demo store
3. **`middleware.ts`** - Clerk middleware for route protection

### Merchant Dashboard

- **`app/dashboard/page.tsx`** - Main dashboard with stats (products, orders, revenue)
- **`app/dashboard/setup/page.tsx`** - Store setup flow for new merchants
- **`app/dashboard/layout.tsx`** - Protected dashboard layout

### Public Storefront

- **`app/store/[slug]/page.tsx`** - Public store catalog
- **`app/store/[slug]/product/[id]/page.tsx`** - Product detail page
- **`app/store/[slug]/order/[orderId]/payment/page.tsx`** - Payment page

### API Routes

- **`app/api/merchant/setup/route.ts`** - Creates merchant store
- **`app/api/orders/create/route.ts`** - Creates order and calculates platform fee
- **`app/api/payments/create-order/route.ts`** - Creates Razorpay order
- **`app/api/payments/verify/route.ts`** - Verifies Razorpay payment signature

### Database

- **`prisma/schema.prisma`** - Multi-tenant schema with:
  - Merchant (isolated per tenant)
  - Product (scoped to merchant)
  - Order (with platform fee calculation)
  - OrderItem
  - PayoutLedger (tracks payouts and fees)

### Components

- **`components/StoreSetupForm.tsx`** - Form for merchant to create store
- **`components/ProductPurchaseForm.tsx`** - Customer order form
- **`components/PaymentForm.tsx`** - Razorpay checkout integration

### Libraries

- **`lib/auth.ts`** - Helper functions for merchant authentication
- **`lib/prisma.ts`** - Prisma client singleton (prevents multiple instances)
- **`lib/razorpay.ts`** - Razorpay client and fee calculation utilities

## Total Files: 38
