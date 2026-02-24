# Admin Settings & RBAC Implementation Summary

## Overview

Rebuilt `/admin/settings` into a comprehensive Super Admin Settings center with RBAC (Role-Based Access Control), removing pricing defaults (now owned by Pricing module).

---

## Route Map

### Settings Landing Page
- **Route**: `/admin/settings`
- **Component**: `app/admin/settings/page.tsx`
- **Description**: Landing page with navigation cards to all settings sections

### Settings Sections

1. **Invoice Issuer Profile**
   - **Route**: `/admin/settings/billing`
   - **Component**: `app/admin/settings/billing/page.tsx`
   - **API**: `GET/POST /api/admin/billing-profile`
   - **Permission**: `billing_profile.read`, `billing_profile.write`

2. **Admin Users**
   - **Route**: `/admin/settings/admin-users`
   - **Component**: `app/admin/settings/admin-users/page.tsx`
   - **API**: 
     - `GET /api/admin/admin-users` (list)
     - `POST /api/admin/admin-users` (create)
     - `PATCH /api/admin/admin-users/[id]` (update)
     - `DELETE /api/admin/admin-users/[id]` (soft delete)
     - `POST /api/admin/admin-users/[id]/roles` (assign roles)
   - **Permissions**: `admin_users.read`, `admin_users.write`, `admin_users.delete`

3. **Roles & Permissions**
   - **Route**: `/admin/settings/roles`
   - **Component**: `app/admin/settings/roles/page.tsx`
   - **API**:
     - `GET /api/admin/roles` (list roles + all permissions)
     - `POST /api/admin/roles` (create role)
     - `PATCH /api/admin/roles/[id]` (update role + permissions)
     - `DELETE /api/admin/roles/[id]` (delete role)
   - **Permissions**: `roles.read`, `roles.write`, `roles.delete`

4. **Audit Logs**
   - **Route**: `/admin/settings/audit-logs`
   - **Component**: `app/admin/settings/audit-logs/page.tsx`
   - **API**: `GET /api/admin/audit-logs` (with filters)
   - **Permission**: `audit_logs.read`

5. **System Settings**
   - **Route**: `/admin/settings/system`
   - **Component**: `app/admin/settings/system/page.tsx`
   - **API**: `GET/POST /api/admin/system-settings`
   - **Permissions**: `system_settings.read`, `system_settings.write`

---

## Prisma Models

### PlatformBillingProfile (Updated)
```prisma
model PlatformBillingProfile {
  id String @id @default("platform")
  
  legalName    String  @default("Smarkitals Technologies India Pvt Ltd")
  gstin        String?
  addressLine1 String?
  addressLine2 String?
  city         String?
  state        String?
  pincode      String?
  email        String?
  phone        String?
  
  invoicePrefix     String @default("SMK")
  invoiceNextNumber Int    @default(1)
  invoicePadding    Int    @default(5)
  seriesFormat      String @default("{PREFIX}-{FY}-{NNNNN}")
  
  defaultSacCode String  @default("9983")
  defaultGstRate Decimal @default(18) @db.Decimal(5, 2)
  footerNote     String? // NEW: Footer note for invoices
  
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
  
  @@map("platform_billing_profile")
}
```

### AdminUser (New)
```prisma
model AdminUser {
  id        String   @id @default(cuid())
  userId    String   @unique // Clerk userId
  email     String
  name      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roles AdminUserRole[]

  @@index([userId])
  @@index([email])
  @@index([isActive])
  @@map("admin_users")
}
```

### Role (New)
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false) // System roles cannot be deleted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permissions RolePermission[]
  adminUsers  AdminUserRole[]

  @@index([name])
  @@map("roles")
}
```

### Permission (New)
```prisma
model Permission {
  id    String @id @default(cuid())
  key   String @unique // e.g., "billing_profile.read"
  label String // Human-readable label

  roles RolePermission[]

  @@index([key])
  @@map("permissions")
}
```

### RolePermission (New - Join Table)
```prisma
model RolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

### AdminUserRole (New - Join Table)
```prisma
model AdminUserRole {
  id         String   @id @default(cuid())
  adminUserId String
  roleId     String
  createdAt  DateTime @default(now())

  adminUser AdminUser @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  role      Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([adminUserId, roleId])
  @@index([adminUserId])
  @@index([roleId])
  @@map("admin_user_roles")
}
```

### SystemSettings (New)
```prisma
model SystemSettings {
  id String @id @default("singleton")

  maintenanceMode      Boolean  @default(false)
  maintenanceBanner    String?
  supportEmail         String?
  supportPhone         String?

  enableCustomDomains  Boolean  @default(true)
  enablePayouts        Boolean  @default(true)
  enablePlatformInvoices Boolean @default(true)

  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@map("system_settings")
}
```

### AdminAuditLog (Updated)
```prisma
model AdminAuditLog {
  id          String   @id @default(cuid())
  actorUserId String   // Clerk userId
  actorEmail  String?
  action      String   // Action name (e.g., "billing_profile.update")
  entityType  String   // Entity type (e.g., "PlatformBillingProfile")
  entityId    String?
  reason      String?
  beforeJson  Json?
  afterJson   Json?
  ip          String?
  userAgent   String?
  metadata    Json?
  createdAt   DateTime @default(now())

  pricingPackage   PricingPackage? @relation(fields: [pricingPackageId], references: [id], onDelete: SetNull)
  pricingPackageId String?

  @@index([actorUserId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("admin_audit_logs")
}
```

---

## Permission Keys

All permissions are defined in `lib/auth/adminRbac.ts`:

```typescript
export const PERMISSIONS = {
  // Billing Profile
  BILLING_PROFILE_READ: "billing_profile.read",
  BILLING_PROFILE_WRITE: "billing_profile.write",

  // Admin Users
  ADMIN_USERS_READ: "admin_users.read",
  ADMIN_USERS_WRITE: "admin_users.write",
  ADMIN_USERS_DELETE: "admin_users.delete",

  // Roles & Permissions
  ROLES_READ: "roles.read",
  ROLES_WRITE: "roles.write",
  ROLES_DELETE: "roles.delete",

  // Audit Logs
  AUDIT_LOGS_READ: "audit_logs.read",

  // System Settings
  SYSTEM_SETTINGS_READ: "system_settings.read",
  SYSTEM_SETTINGS_WRITE: "system_settings.write",

  // Platform Invoices
  PLATFORM_INVOICES_READ: "platform_invoices.read",
  PLATFORM_INVOICES_WRITE: "platform_invoices.write",

  // Payouts
  PAYOUTS_READ: "payouts.read",
  PAYOUTS_EXECUTE: "payouts.execute",

  // Merchants
  MERCHANTS_READ: "merchants.read",
  MERCHANTS_WRITE: "merchants.write",
}
```

---

## Admin Actions Protected by Permissions

### Billing Profile
- **Read**: `billing_profile.read`
  - `GET /api/admin/billing-profile`
- **Write**: `billing_profile.write`
  - `POST /api/admin/billing-profile` (update billing profile)

### Admin Users
- **Read**: `admin_users.read`
  - `GET /api/admin/admin-users` (list all admin users)
- **Write**: `admin_users.write`
  - `POST /api/admin/admin-users` (create admin user)
  - `PATCH /api/admin/admin-users/[id]` (update admin user)
  - `POST /api/admin/admin-users/[id]/roles` (assign roles to user)
- **Delete**: `admin_users.delete`
  - `DELETE /api/admin/admin-users/[id]` (soft delete by setting isActive=false)

### Roles & Permissions
- **Read**: `roles.read`
  - `GET /api/admin/roles` (list roles + all permissions)
- **Write**: `roles.write`
  - `POST /api/admin/roles` (create role)
  - `PATCH /api/admin/roles/[id]` (update role + permissions)
- **Delete**: `roles.delete`
  - `DELETE /api/admin/roles/[id]` (delete role, cannot delete system roles)

### Audit Logs
- **Read**: `audit_logs.read`
  - `GET /api/admin/audit-logs` (list audit logs with filters)

### System Settings
- **Read**: `system_settings.read`
  - `GET /api/admin/system-settings` (get system settings)
- **Write**: `system_settings.write`
  - `POST /api/admin/system-settings` (update system settings)

### Platform Invoices (Future)
- **Read**: `platform_invoices.read`
  - View platform invoices
- **Write**: `platform_invoices.write`
  - Cancel platform invoices

### Payouts (Future)
- **Read**: `payouts.read`
  - View payouts
- **Execute**: `payouts.execute`
  - Execute payout batches

### Merchants (Future)
- **Read**: `merchants.read`
  - View merchants
- **Write**: `merchants.write`
  - Update merchant settings

---

## Access Control Implementation

### Super Admin Bypass
Users in `SUPER_ADMIN_USER_IDS` environment variable automatically have all permissions.

### Permission Checking
- **Server-side**: All API routes use `requirePermission(permissionKey)` which throws `Response` with 403 if denied
- **Client-side**: UI can check permissions via `getAdminUserWithPermissions()` helper

### Audit Logging
All write operations create audit log entries with:
- Actor (userId, email)
- Action name
- Entity type and ID
- Before/after JSON snapshots
- Optional reason

---

## Migration Steps

1. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev --name admin_settings_rbac
   npx prisma generate
   ```

2. **Seed Permissions** (one-time):
   ```typescript
   // Run in a script or seed file
   import { seedPermissions, seedDefaultRoles } from "@/lib/billing/seedPermissions"
   await seedPermissions()
   await seedDefaultRoles()
   ```

3. **Create Initial Admin Users**:
   - Use `/admin/settings/admin-users` UI to create admin users
   - Assign "Super Admin" role to initial super admins

---

## Deprecated Components

- **`components/admin/PlatformSettingsForm.tsx`**: Deprecated (pricing defaults moved to Pricing module)
- **`app/admin/settings/page.tsx`**: Replaced with new settings landing page (no longer shows pricing defaults)

---

## Files Created/Modified

### New Files
1. `lib/auth/adminRbac.ts` - RBAC helpers and permission definitions
2. `lib/billing/seedPermissions.ts` - Permission seeding utilities
3. `app/admin/settings/page.tsx` - New settings landing page
4. `app/admin/settings/admin-users/page.tsx` - Admin users CRUD UI
5. `app/admin/settings/roles/page.tsx` - Roles & permissions UI
6. `app/admin/settings/audit-logs/page.tsx` - Audit logs viewer
7. `app/admin/settings/system/page.tsx` - System settings UI
8. `app/api/admin/admin-users/route.ts` - Admin users API
9. `app/api/admin/admin-users/[id]/route.ts` - Admin user update/delete API
10. `app/api/admin/admin-users/[id]/roles/route.ts` - Role assignment API
11. `app/api/admin/roles/route.ts` - Roles API
12. `app/api/admin/roles/[id]/route.ts` - Role update/delete API
13. `app/api/admin/audit-logs/route.ts` - Audit logs API
14. `app/api/admin/system-settings/route.ts` - System settings API
15. `components/ui/checkbox.tsx` - Checkbox component (for permission matrix)

### Modified Files
1. `prisma/schema.prisma` - Added RBAC models, updated PlatformBillingProfile, AdminAuditLog
2. `app/admin/settings/billing/page.tsx` - Added footerNote field
3. `app/api/admin/billing-profile/route.ts` - Updated to use permission checks and audit logging
4. `components/AdminSidebar.tsx` - Added Settings link
5. `package.json` - Added `@radix-ui/react-checkbox` dependency

---

## Next Steps

1. Run Prisma migration to create new tables
2. Seed permissions using `seedPermissions()` function
3. Create initial admin users and assign roles
4. Test permission checks on all admin routes
5. (Optional) Migrate existing super admins to AdminUser table
