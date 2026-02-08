# Admin Backoffice Documentation

## Overview

Simple internal admin backoffice for platform owners to manage merchants, view platform stats, and configure fees.

## Security

- **Route Protection**: `/admin` routes are protected by allowlist
- **Allowlist**: Comma-separated list of Clerk user IDs in `ADMIN_USER_IDS` environment variable
- **Middleware**: Checks allowlist before allowing access to admin routes
- **Server Actions**: All admin actions verify admin access

## Setup

### 1. Add Admin User IDs to Environment

Add to your `.env` file:

```bash
# Admin Backoffice
# Comma-separated list of Clerk user IDs allowed to access /admin
ADMIN_USER_IDS=user_xxx,user_yyy
```

To find your Clerk user ID:
1. Sign in to your app
2. Check Clerk dashboard > Users
3. Copy the User ID

### 2. Access Admin Backoffice

Navigate to `/admin` in your browser. If your user ID is in the allowlist, you'll see the admin dashboard.

## Features

### Platform Overview

- **Total Merchants**: Count of all merchants (active + inactive)
- **Total Orders**: Count of all orders across all merchants
- **Total GMV**: Gross Merchandise Value (sum of all order gross amounts)
- **Total Fees**: Platform fees collected (from ledger entries)

### Merchant Management

For each merchant, you can:

1. **View Stats**:
   - Order count
   - Product count
   - GMV (Gross Merchandise Value)
   - Total fees collected

2. **Toggle Active Status**:
   - Activate/deactivate merchants
   - Inactive merchants cannot accept orders

3. **Configure Fee Settings**:
   - Percentage fee (in basis points)
   - Flat fee (in paise)
   - Maximum cap (in paise)
   - Leave empty to use platform defaults

## Files Created

### Core Files

1. **`lib/admin.ts`**
   - Admin authentication helpers
   - `isAdmin()`: Check if user is admin
   - `requireAdmin()`: Require admin access (redirects if not)

2. **`app/admin/layout.tsx`**
   - Admin layout with protection
   - Redirects non-admins to home

3. **`app/admin/page.tsx`**
   - Admin dashboard
   - Platform stats overview
   - Merchants list

4. **`app/actions/admin.ts`**
   - Server actions for admin operations:
     - `toggleMerchantStatus()`: Toggle merchant active/inactive
     - `updateMerchantFeeConfig()`: Update merchant fee configuration

5. **`app/api/admin/merchants/route.ts`**
   - API endpoint to fetch all merchants with stats
   - Protected by admin allowlist

6. **`components/admin/MerchantsList.tsx`**
   - Client component for merchant management
   - Displays merchant cards with stats
   - Edit fee configuration inline
   - Toggle active status

### Modified Files

1. **`middleware.ts`**
   - Added admin route protection
   - Checks `ADMIN_USER_IDS` allowlist

## Usage Examples

### Toggle Merchant Status

```typescript
// In MerchantsList component
await toggleMerchantStatus(merchantId, true) // Activate
await toggleMerchantStatus(merchantId, false) // Deactivate
```

### Update Fee Configuration

```typescript
await updateMerchantFeeConfig(merchantId, {
  feePercentageBps: 300,  // 3%
  feeFlatPaise: 1000,      // ₹10
  feeMaxCapPaise: 5000,    // ₹50
})
```

### Use Platform Defaults

Set all values to `null` to use platform defaults (2% + ₹5, max ₹25):

```typescript
await updateMerchantFeeConfig(merchantId, {
  feePercentageBps: null,
  feeFlatPaise: null,
  feeMaxCapPaise: null,
})
```

## Security Considerations

1. ✅ **Allowlist-based access**: Only specified user IDs can access
2. ✅ **Server-side verification**: All actions verify admin access
3. ✅ **Middleware protection**: Routes protected at middleware level
4. ✅ **No client-side secrets**: Admin checks only on server

## Environment Variables

```bash
# Required for admin access
ADMIN_USER_IDS=user_xxx,user_yyy
```

## Testing

1. **Add your Clerk user ID to `ADMIN_USER_IDS`**
2. **Sign in to your app**
3. **Navigate to `/admin`**
4. **Verify you can see platform stats and merchants**
5. **Test toggling merchant status**
6. **Test updating fee configuration**

## Future Enhancements

- [ ] Merchant search/filter
- [ ] Order details view
- [ ] Payout management
- [ ] Platform settings
- [ ] Activity logs
- [ ] Export reports
