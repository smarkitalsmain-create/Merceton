# Authentication & Tenant Isolation Implementation

## Overview

This document explains the authentication and tenant isolation implementation for the multi-tenant ecommerce SaaS platform.

## Authentication Stack

**Clerk** is used as the authentication provider because:
- Built-in user management and session handling
- Easy integration with Next.js App Router
- Supports multiple authentication methods (email, OAuth, etc.)
- Handles security best practices (CSRF, XSS protection)
- Free tier suitable for MVP

## Architecture

### User Flow

1. **User signs in** → Clerk authenticates
2. **User accesses `/dashboard`** → Middleware checks authentication
3. **User has no merchant** → Redirected to `/onboarding/create-store`
4. **User creates store** → Merchant and User records created
5. **User accesses dashboard** → All queries scoped to `merchantId`

### Data Model

```
Clerk User (authUserId)
    ↓
User (authUserId → merchantId)
    ↓
Merchant (tenant)
    ↓
All Resources (products, orders, etc.) scoped by merchantId
```

## Middleware (`middleware.ts`)

The middleware handles:
- **Public routes**: `/`, `/s/*`, `/api/webhooks/*`
- **Protected routes**: `/dashboard/*` (requires authentication)
- **Onboarding redirect**: Handled in layout/route handlers

```typescript
export default authMiddleware({
  publicRoutes: ["/", "/s/(.*)", "/api/webhooks/(.*)"],
  afterAuth: async (auth, req) => {
    // Redirect unauthenticated users trying to access dashboard
    if (!auth.userId && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }
    return NextResponse.next()
  },
})
```

## Authorization Helpers (`lib/auth.ts`)

### Core Functions

#### `getCurrentUser()`
- Gets authenticated Clerk user and associated User record
- Returns `null` if not authenticated

#### `getCurrentMerchant()`
- Gets user's merchant
- Returns `null` if user has no merchant

#### `requireAuth()`
- Throws if not authenticated
- Redirects to `/sign-in`

#### `requireUser()`
- Requires authentication
- Redirects to `/onboarding/create-store` if user has no merchant

#### `requireMerchant()`
- Requires user to have a merchant
- Redirects to onboarding if merchant not found
- **Use in all dashboard pages/layouts**

#### `requireAdmin()`
- Requires user to be ADMIN role
- Throws error if not admin
- **Use for settings and admin-only routes**

### Tenant Isolation Helpers

#### `ensureTenantAccess(resourceMerchantId, userMerchantId)`
- Throws error if merchant IDs don't match
- **Use when accessing specific resources by ID**

#### `authorizeRequest(resourceMerchantId?)`
- Returns `{ user, merchant }` with tenant isolation
- If `resourceMerchantId` provided, ensures it matches user's merchant
- **Use in API routes**

## Usage Examples

### Server Component (Dashboard Page)

```typescript
// app/dashboard/page.tsx
import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  // Ensures user is authenticated and has merchant
  // Redirects to onboarding if no merchant
  const merchant = await requireMerchant()

  // All queries MUST be scoped to merchant.id
  const products = await prisma.product.findMany({
    where: { merchantId: merchant.id }, // CRITICAL: Tenant isolation
  })

  return <div>...</div>
}
```

### API Route (List Resources)

```typescript
// app/api/products/route.ts
import { authorizeRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Authorize and get merchant
  const { merchant } = await authorizeRequest()

  // Query scoped to merchant.id
  const products = await prisma.product.findMany({
    where: { merchantId: merchant.id }, // CRITICAL: Tenant isolation
  })

  return NextResponse.json({ products })
}
```

### API Route (Resource-Specific)

```typescript
// app/api/products/[id]/route.ts
import { authorizeRequest, ensureTenantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { merchant } = await authorizeRequest()

  // Get resource
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // CRITICAL: Ensure tenant access
  // Prevents accessing other merchants' products even if ID is known
  ensureTenantAccess(product.merchantId, merchant.id)

  return NextResponse.json({ product })
}
```

### Admin-Only Route

```typescript
// app/dashboard/settings/page.tsx
import { requireAdmin } from "@/lib/auth"

export default async function SettingsPage() {
  // Only admins can access
  const { merchant, user } = await requireAdmin()

  return <div>Settings (Admin only)</div>
}
```

## Onboarding Flow

### Route: `/onboarding/create-store`

1. User signs in (via Clerk)
2. User tries to access `/dashboard`
3. `requireMerchant()` detects no merchant
4. Redirects to `/onboarding/create-store`
5. User fills form (store name, slug)
6. POST to `/api/merchant/setup`
7. Creates:
   - `Merchant` record
   - `User` record (links `authUserId` to `merchantId`)
   - `StorefrontSettings` record
8. Redirects to `/dashboard`

### Store Setup API (`app/api/merchant/setup/route.ts`)

```typescript
export async function POST(request: NextRequest) {
  const { userId } = auth() // Clerk user ID
  
  // Create merchant and user in one transaction
  const merchant = await prisma.merchant.create({
    data: {
      slug: storeSlug,
      displayName: storeName,
      users: {
        create: {
          authUserId: userId, // Link to Clerk
          email: userId,
          role: "ADMIN",
        },
      },
      storefront: {
        create: {
          theme: "minimal",
        },
      },
    },
  })
}
```

## Tenant Isolation Rules

### ✅ DO

1. **Always scope queries by `merchantId`**:
   ```typescript
   prisma.product.findMany({
     where: { merchantId: merchant.id }
   })
   ```

2. **Use `requireMerchant()` in dashboard pages**:
   ```typescript
   const merchant = await requireMerchant()
   ```

3. **Use `authorizeRequest()` in API routes**:
   ```typescript
   const { merchant } = await authorizeRequest()
   ```

4. **Check tenant access for resource-specific operations**:
   ```typescript
   ensureTenantAccess(resource.merchantId, merchant.id)
   ```

### ❌ DON'T

1. **Never query without `merchantId` filter**:
   ```typescript
   // ❌ WRONG - exposes all merchants' data
   prisma.product.findMany()
   ```

2. **Never trust client-provided `merchantId`**:
   ```typescript
   // ❌ WRONG - client can manipulate
   const products = await prisma.product.findMany({
     where: { merchantId: req.body.merchantId }
   })
   ```

3. **Never skip tenant check for resource access**:
   ```typescript
   // ❌ WRONG - can access other merchants' products
   const product = await prisma.product.findUnique({
     where: { id: productId }
   })
   // Missing: ensureTenantAccess(product.merchantId, merchant.id)
   ```

## Security Considerations

1. **Server-side only**: All authorization checks happen server-side
2. **No client-side merchant ID**: Never send `merchantId` to client or trust client-provided IDs
3. **Database-level**: All queries filtered by `merchantId` at database level
4. **Role-based**: Admin-only routes use `requireAdmin()`
5. **URL manipulation protection**: Even if user knows another merchant's resource ID, `ensureTenantAccess()` prevents access

## Testing Tenant Isolation

To test tenant isolation:

1. Create two merchants (Merchant A and Merchant B)
2. Create products for Merchant A
3. As Merchant B user, try to access Merchant A's product ID
4. Should get 403 Forbidden error

Example test:
```typescript
// As Merchant B user
const { merchant: merchantB } = await authorizeRequest()
const productA = await prisma.product.findFirst({
  where: { merchantId: merchantA.id }
})

// This should throw
ensureTenantAccess(productA.merchantId, merchantB.id)
// Error: "Unauthorized: Access denied to this resource"
```

## Routes Summary

### Public Routes
- `/` - Landing page
- `/s/[slug]` - Public storefront
- `/s/[slug]/product/[id]` - Product page
- `/s/[slug]/order/[orderId]/payment` - Payment page

### Protected Routes (Require Auth)
- `/dashboard` - Dashboard home
- `/dashboard/products` - Product management
- `/dashboard/orders` - Order management
- `/dashboard/settings` - Settings (Admin only)

### Onboarding
- `/onboarding/create-store` - Store creation (redirects if merchant exists)

## Future Enhancements

1. **Multiple merchants per user**: Update `User` model to support `merchantId[]`
2. **Team members**: Add `STAFF` role with limited permissions
3. **API keys**: For programmatic access with tenant scoping
4. **Audit logs**: Track all tenant-scoped operations
