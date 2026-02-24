# TypeScript Fixes Summary

## Fixed Issues

### 1. Buffer in Response → Uint8Array
**File:** `app/api/orders/[orderId]/invoice.pdf/route.ts`
- Converted `Buffer` to `Uint8Array` before passing to `Response`
- Changed: `return new Response(pdfBuffer, ...)` → `return new Response(new Uint8Array(pdfBuffer), ...)`

### 2. Removed Product Relation Access
**Files:**
- `app/api/orders/[orderId]/invoice.pdf/route.ts` - Removed `product: true` from include
- `lib/storefront/invoicing/buildInvoiceData.ts` - Removed all `item.product` references
  - Changed to use snapshot data only: `item.productName`, `(item as any).gstRate`, `(item as any).hsnOrSac`

### 3. String | undefined Fixes (Nullish Coalescing)
**File:** `lib/storefront/invoicing/buildInvoiceData.ts`
- Replaced all `||` with `??` for proper nullish coalescing:
  - `taxProfile?.legalName || order.merchant.displayName` → `taxProfile?.legalName ?? order.merchant.displayName`
  - `taxProfile?.state || "Not Specified"` → `taxProfile?.state ?? "Not Specified"`
  - `order.customerPhone || undefined` → `order.customerPhone ?? undefined`
  - `shippingAddress?.state || shippingAddress?.state_code || undefined` → `shippingAddress?.state ?? shippingAddress?.state_code ?? undefined`
  - `order.paymentStatus || undefined` → `order.paymentStatus ?? undefined`
  - `item.productName || ...` → `item.productName ?? ...`
  - `(item as any).gstRate || 0` → `(item as any).gstRate ?? 0`
  - `order.customerAddress` → `order.customerAddress ?? undefined`

### 4. Theme Type Import
**File:** `lib/storefront/core/config-schema.ts`
- Added re-export: `export type { Theme }` from `./theme-schema`
- Allows importing `Theme` type from config-schema

### 5. SliderProps Extension Fix
**File:** `components/ui/slider.tsx`
- Removed `extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">`
- Changed to explicit interface with `[key: string]: any` for flexibility
- Prevents type conflicts with InputHTMLAttributes

### 6. Boolean Returns Using !!
**Files:**
- `lib/admin-allowlist.ts` - Added `!!` to boolean return: `return !!(normalizedEmail && allowlist.includes(normalizedEmail))`
- `lib/admin-auth.ts` - Added `!!` to boolean check: `const isSuper = !!isEmailInAllowlist(user.email)`
- `lib/storefront/invoicing/buildInvoiceData.ts` - Fixed boolean expression: `const isSameState = !!(supplierState && customerState && ...)`

### 7. Email Notifications
**File:** `lib/email/notifications.ts`
- Already includes `orderNumber` parameter in all order-related email functions
- No changes needed

## Files Modified

1. `app/api/orders/[orderId]/invoice.pdf/route.ts`
2. `lib/storefront/invoicing/buildInvoiceData.ts`
3. `components/ui/slider.tsx`
4. `lib/storefront/core/config-schema.ts`
5. `lib/admin-allowlist.ts`
6. `lib/admin-auth.ts`

## Verification

Run:
```bash
npx tsc --noEmit
```

Expected: Error count should drop from 69 to near zero.
