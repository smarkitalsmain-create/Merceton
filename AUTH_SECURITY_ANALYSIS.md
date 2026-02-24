# Authentication & Security Analysis

Complete analysis of authentication, authorization, tenant isolation, and security weak points.

---

## 1. User Identity Derivation

### Identity Source: Supabase Auth

**Flow**:
1. User signs in via Supabase Auth (`/sign-in`, `/sign-up`)
2. Supabase sets session cookies (`sb-*` cookies)
3. Server reads cookies to get authenticated user

**Key Files**:
- `lib/supabase/server-readonly.ts` - Read-only client for Server Components
- `lib/supabase/admin-server-readonly.ts` - Read-only client for admin Server Components
- `lib/supabase/server.ts` - Mutable client (only for middleware, route handlers, auth callbacks)

**Identity Resolution Chain**:
```
Supabase Cookie → supabase.auth.getUser() → authUser.id (Supabase user ID)
  ↓
prisma.user.findUnique({ where: { authUserId } }) → DB User record
  ↓
user.merchant → Merchant record (if exists)
```

**Code Path**:
```typescript
// lib/auth.ts - requireUser()
const authUser = await requireAuth() // Gets Supabase user from cookie
const user = await prisma.user.upsert({
  where: { authUserId: authUser.id },
  // Creates/updates DB user record
})
```

**Important Notes**:
- Supabase user ID (`authUserId`) is the source of truth
- DB `User` record is created/updated on first access (upsert pattern)
- `User.merchantId` can be `null` (user without merchant)
- One Supabase user = One DB User (enforced by `authUserId` @unique)

---

## 2. Admin vs Merchant Determination

### Two Separate Systems

#### A. Merchant Users (Dashboard)
**Determination**: User has `merchantId` in DB

**Flow**:
1. User signs in → `requireUser()` → Gets DB user
2. Check: `user.merchant !== null` → Is merchant user
3. If no merchant → Redirect to `/onboarding/create-store`

**Functions**:
- `requireMerchant()` - Requires merchant, redirects if missing
- `requireAdmin()` - Requires merchant + role === "ADMIN" (for future STAFF role)
- `authorizeRequest()` - API route helper, returns `{ user, merchant }`

**Code**:
```typescript
// lib/auth.ts
export async function requireMerchant() {
  const user = await requireUser()
  if (!user.merchant) redirect("/onboarding/create-store")
  return user.merchant
}
```

#### B. Platform Admins (Super Admin Panel)
**Determination**: Email in `SUPER_ADMIN_EMAILS` env var

**Flow**:
1. User signs in → `requireSuperAdmin()` or `requireAdmin()`
2. Check: `isEmailInAllowlist(user.email)` → Is super admin
3. If not in allowlist → Redirect to `/dashboard` or throw 403

**Functions**:
- `requireSuperAdmin()` - Page routes (redirects)
- `requireAdmin()` / `requirePlatformAdmin()` - API routes (throws errors)
- `isSuperAdmin()` - Non-throwing check

**Code**:
```typescript
// lib/admin-auth.ts
export async function requireAdmin() {
  const supabase = createSupabaseAdminServerReadonlyClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("UNAUTHORIZED")
  
  const dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
    select: { email: true },
  })
  
  if (!dbUser || !isEmailInAllowlist(dbUser.email)) {
    throw new Error("FORBIDDEN") // 403
  }
  
  return { userId: user.id, email: user.email, name: ... }
}
```

**Allowlist Configuration**:
```typescript
// lib/admin-allowlist.ts
export function isEmailInAllowlist(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  const allowlist = process.env.SUPER_ADMIN_EMAILS
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(normalizedEmail)
}
```

**Key Differences**:
| Aspect | Merchant | Platform Admin |
|--------|----------|----------------|
| **Determination** | `user.merchant !== null` | Email in `SUPER_ADMIN_EMAILS` |
| **Access Level** | Own merchant data only | All merchants' data |
| **Routes** | `/dashboard/*` | `/admin/*` |
| **Auth File** | `lib/auth.ts` | `lib/admin-auth.ts` |
| **RBAC** | Simple (ADMIN/STAFF role) | Full RBAC system (optional) |

---

## 3. Tenant Isolation Enforcement

### Enforcement Layers

#### Layer 1: Authentication (Middleware)
**File**: `middleware.ts`

**What it does**:
- Refreshes Supabase session for protected routes (`/dashboard`, `/admin`)
- Does NOT enforce tenant isolation (just refreshes cookies)
- Allows cookie writes (only place where cookies can be written)

**Code**:
```typescript
if (isProtectedRoute) {
  const supabase = createServerClient(...)
  await supabase.auth.getUser() // Refreshes session
}
```

#### Layer 2: Authorization (Route Handlers)
**Files**: `lib/auth.ts`, `lib/admin-auth.ts`

**What it does**:
- Ensures user is authenticated
- Ensures user has merchant (for merchant routes)
- Returns `merchant` object for tenant scoping

**Functions**:
- `requireMerchant()` - Gets merchant, redirects if missing
- `authorizeRequest()` - Gets merchant for API routes
- `ensureTenantAccess(resourceMerchantId, userMerchantId)` - Validates resource ownership

#### Layer 3: Database Queries (Application Code)
**Critical**: All queries MUST filter by `merchantId`

**Pattern**:
```typescript
// ✅ CORRECT - Always filter by merchant.id
const products = await prisma.product.findMany({
  where: {
    merchantId: merchant.id, // From authorizeRequest()
    isActive: true,
  },
})

// ❌ WRONG - Exposes all merchants' data
const products = await prisma.product.findMany()
```

**Resource-Specific Checks**:
```typescript
// ✅ CORRECT - Check resource ownership
const product = await prisma.product.findUnique({ where: { id } })
ensureTenantAccess(product.merchantId, merchant.id)

// ❌ WRONG - Can access other merchants' products
const product = await prisma.product.findUnique({ where: { id } })
// Missing: ensureTenantAccess()
```

### Tenant Isolation Rules

1. **Always use `authorizeRequest()` in API routes**:
   ```typescript
   const { merchant } = await authorizeRequest()
   ```

2. **Always filter queries by `merchantId`**:
   ```typescript
   where: { merchantId: merchant.id }
   ```

3. **Always check resource ownership for GET/PUT/DELETE**:
   ```typescript
   ensureTenantAccess(resource.merchantId, merchant.id)
   ```

4. **Never trust client-provided `merchantId`**:
   ```typescript
   // ❌ WRONG
   const products = await prisma.product.findMany({
     where: { merchantId: req.body.merchantId }
   })
   ```

---

## 4. Security Weak Points

### 🔴 CRITICAL: Missing Tenant Isolation

#### 1. Payment Routes (Public API)
**Files**:
- `app/api/payments/create-razorpay-order/route.ts`
- `app/api/payments/verify/route.ts`

**Issue**: No authentication or tenant check

**Vulnerability**:
```typescript
// app/api/payments/create-razorpay-order/route.ts
const order = await prisma.order.findUnique({
  where: { id: orderId }, // ❌ No merchantId check
})
// Anyone with an orderId can create Razorpay order
```

**Risk**: 
- Attacker can create Razorpay orders for any merchant's orders
- Attacker can verify payments for any merchant's orders
- Could lead to payment fraud

**Fix Required**:
```typescript
// Option A: Public API (storefront) - validate via storeSlug
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    merchant: { slug: storeSlug }, // Validate via slug
  },
})

// Option B: Authenticated API - use authorizeRequest()
const { merchant } = await authorizeRequest()
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    merchantId: merchant.id,
  },
})
```

#### 2. Order Creation (Public API)
**File**: `app/api/orders/create/route.ts`

**Issue**: Public endpoint, relies on `storeSlug` validation

**Current Protection**:
```typescript
// app/actions/orders.ts - createOrder()
const merchant = await prisma.merchant.findUnique({
  where: { 
    id: validatedInput.merchantId,
    slug: validatedInput.storeSlug, // ✅ Validates slug matches
    isActive: true,
  },
})
```

**Status**: ✅ **SAFE** - Validates `merchantId` matches `storeSlug`

**Note**: This is a public API (storefront), so no auth required. Validation via slug is correct.

#### 3. Webhook Handler
**File**: `app/api/webhooks/razorpay/route.ts`

**Issue**: No tenant validation (but webhook signature verified)

**Current Protection**:
- ✅ Webhook signature verified (HMAC)
- ✅ Amount validation
- ✅ Idempotency (prevents duplicate processing)

**Status**: ✅ **SAFE** - Webhooks are external, signature verification is sufficient

**Note**: Webhooks don't need tenant checks because:
1. Signature proves authenticity
2. Webhook comes from Razorpay (trusted source)
3. Amount validation prevents tampering

### 🟡 MEDIUM: Inconsistent Auth Patterns

#### 4. Merchant Orders API
**Files**:
- `app/api/merchant/orders/route.ts`
- `app/api/merchant/orders/[orderId]/route.ts`

**Issue**: Uses `createSupabaseServerClient()` directly instead of `authorizeRequest()`

**Current Code**:
```typescript
// app/api/merchant/orders/route.ts
const supabase = createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
const dbUser = await prisma.user.findUnique({
  where: { authUserId: user.id },
  include: { merchant: true },
})
// Then filters by merchantId ✅
```

**Status**: ✅ **SAFE** - Does filter by `merchantId`, but inconsistent pattern

**Recommendation**: Refactor to use `authorizeRequest()` for consistency:
```typescript
const { merchant } = await authorizeRequest()
const orders = await prisma.order.findMany({
  where: { merchantId: merchant.id },
})
```

#### 5. Admin Routes
**Files**: Various `/api/admin/*` routes

**Issue**: Some use `requireAdmin()`, some use `requirePlatformAdmin()`

**Status**: ✅ **SAFE** - Both functions do the same thing (alias)

**Recommendation**: Standardize on `requireAdmin()` for consistency

### 🟢 LOW: Missing Resource Ownership Checks

#### 6. Storefront Config API
**File**: `app/api/storefront/config/route.ts`

**Current Code**:
```typescript
const merchant = await requireMerchant()
// Then queries/updates by merchantId ✅
```

**Status**: ✅ **SAFE** - Uses `merchantId` from `requireMerchant()`

#### 7. Product Routes
**Files**:
- `app/api/products/route.ts` ✅
- `app/api/products/[id]/route.ts` ✅

**Status**: ✅ **SAFE** - Uses `authorizeRequest()` and `ensureTenantAccess()`

**Example**:
```typescript
const { merchant } = await authorizeRequest()
const products = await prisma.product.findMany({
  where: { merchantId: merchant.id },
})
// For GET/PUT: ensureTenantAccess(product.merchantId, merchant.id)
```

### 🔵 INFO: RBAC System (Not Fully Used)

#### 8. RBAC Implementation
**File**: `lib/auth/adminRbac.ts`

**Status**: ✅ **IMPLEMENTED** but not widely used

**Functions Available**:
- `hasPermission(userId, permissionKey)` - Check permission
- `requirePermission(permissionKey)` - Require permission
- `getAdminUserWithPermissions()` - Get user with all permissions

**Current Usage**: Only in `lib/auth/adminRbac.ts`, not used in routes

**Recommendation**: 
- Use RBAC for granular admin permissions
- Replace email allowlist with role-based system for production

---

## 5. Security Recommendations

### Immediate Fixes (Critical)

1. **Fix Payment Routes**:
   ```typescript
   // app/api/payments/create-razorpay-order/route.ts
   export async function POST(request: NextRequest) {
     const body = await request.json()
     const { orderId, storeSlug } = body // Require storeSlug
     
     const order = await prisma.order.findFirst({
       where: {
         id: orderId,
         merchant: { slug: storeSlug, isActive: true },
       },
     })
     
     if (!order) {
       return NextResponse.json({ error: "Order not found" }, { status: 404 })
     }
     // ... rest of code
   }
   ```

2. **Fix Payment Verify Route**:
   ```typescript
   // app/api/payments/verify/route.ts
   export async function POST(request: NextRequest) {
     const body = await request.json()
     const { orderId, storeSlug } = body // Require storeSlug
     
     const order = await prisma.order.findFirst({
       where: {
         id: orderId,
         merchant: { slug: storeSlug, isActive: true },
       },
     })
     // ... rest of code
   }
   ```

### Code Quality Improvements

3. **Standardize Auth Patterns**:
   - Use `authorizeRequest()` in all merchant API routes
   - Use `requireAdmin()` in all admin API routes
   - Remove direct `createSupabaseServerClient()` usage

4. **Add Tenant Checks to All Resource Operations**:
   ```typescript
   // Pattern for GET/PUT/DELETE
   const resource = await prisma.resource.findUnique({ where: { id } })
   ensureTenantAccess(resource.merchantId, merchant.id)
   ```

5. **Add Rate Limiting to Payment Routes**:
   ```typescript
   // Already has rate limiting for order creation
   // Add to payment routes too
   const clientId = getClientIdentifier(request)
   if (!rateLimit(clientId, 10, 60000)) {
     return NextResponse.json({ error: "Too many requests" }, { status: 429 })
   }
   ```

### Long-term Improvements

6. **Implement RBAC for Admin**:
   - Replace email allowlist with role-based system
   - Use `requirePermission()` in admin routes
   - Add permission checks for sensitive operations

7. **Add Audit Logging**:
   - Log all tenant-scoped operations
   - Track who accessed what data
   - Monitor for suspicious patterns

8. **Add Database-Level Constraints**:
   - Consider Row Level Security (RLS) in Postgres
   - Add check constraints for tenant isolation
   - Use database views for tenant-scoped queries

---

## 6. Summary

### ✅ What's Working Well

1. **Merchant Routes**: Most routes use `authorizeRequest()` and filter by `merchantId`
2. **Admin Routes**: Use email allowlist (simple but effective)
3. **Middleware**: Properly refreshes sessions
4. **Product Routes**: Good example of tenant isolation
5. **Order Creation**: Public API correctly validates via `storeSlug`

### 🔴 Critical Issues

1. **Payment Routes**: Missing tenant validation (HIGH RISK)
2. **Payment Verify**: Missing tenant validation (HIGH RISK)

### 🟡 Medium Issues

1. **Inconsistent Auth Patterns**: Some routes use direct Supabase client
2. **RBAC Not Used**: Implemented but not utilized

### 🟢 Low Issues

1. **Code Quality**: Some routes could be refactored for consistency
2. **Documentation**: Could add more inline security comments

---

## 7. Testing Recommendations

### Test Tenant Isolation

1. **Create two merchants** (Merchant A, Merchant B)
2. **Create resources for Merchant A** (products, orders)
3. **As Merchant B user**, try to access Merchant A's resources:
   - Should get 403 Forbidden
   - Should not see Merchant A's data in lists

### Test Payment Routes

1. **Create order for Merchant A**
2. **As unauthenticated user**, try to create Razorpay order with Merchant A's orderId
3. **Should fail** (after fix) or require `storeSlug` validation

### Test Admin Access

1. **User not in allowlist** tries to access `/admin/*`
2. **Should redirect** to `/dashboard` or return 403

---

## 8. Quick Reference

### Merchant Routes
```typescript
// ✅ CORRECT PATTERN
const { merchant } = await authorizeRequest()
const resources = await prisma.resource.findMany({
  where: { merchantId: merchant.id },
})
```

### Admin Routes
```typescript
// ✅ CORRECT PATTERN
await requireAdmin() // Throws 401/403 if not admin
// Then query without merchantId (admin can see all)
```

### Resource-Specific Operations
```typescript
// ✅ CORRECT PATTERN
const resource = await prisma.resource.findUnique({ where: { id } })
ensureTenantAccess(resource.merchantId, merchant.id)
// Then proceed with update/delete
```

### Public APIs (Storefront)
```typescript
// ✅ CORRECT PATTERN (for public APIs)
const merchant = await prisma.merchant.findFirst({
  where: {
    slug: storeSlug,
    isActive: true,
  },
})
// Validate merchantId matches slug if provided
```
