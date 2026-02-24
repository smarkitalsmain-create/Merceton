# Merceton Route Catalog

Complete list of all page routes in the application, organized by role and purpose.

## Public Routes (No Authentication)

| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/` | Landing page | View welcome page, navigate to sign-in/sign-up |
| `/sign-in` | User sign-in | Authenticate with email/password |
| `/sign-up` | User registration | Create new account |
| `/forgot-password` | Password reset request | Request password reset email |
| `/reset-password` | Password reset form | Reset password with token |
| `/s/[slug]` | Public storefront home | Browse products, view store |
| `/s/[slug]/p/[productId]` | Product detail page | View product details, add to cart |
| `/s/[slug]/checkout` | Checkout page | Enter shipping details, select payment, place order |
| `/s/[slug]/order/[orderId]` | Order confirmation | View order details after purchase |
| `/s/[slug]/order/[orderId]/payment` | Payment page | Complete payment for order |

## Merchant Dashboard Routes (Requires Merchant Authentication)

### Main Dashboard
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/dashboard` | Merchant dashboard home | View stats (products, orders, revenue), quick actions |
| `/dashboard/setup` | Initial setup wizard | Complete store setup |
| `/dashboard/onboarding` | Onboarding flow | Complete merchant onboarding (PAN, GST, business details) |
| `/dashboard/account-hold` | Account hold notice | View account hold reason and status |

### Products Management
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/dashboard/products` | Products list | View all products, search, filter by status, delete products |
| `/dashboard/products/new` | Create product | Add new product (name, description, price, MRP, SKU, stock, images) |
| `/dashboard/products/[id]/edit` | Edit product | Update product details, images, stock |

### Orders Management
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/dashboard/orders` | Orders list | View all orders, filter by status, export CSV (orders/items) |
| `/dashboard/orders/[orderId]` | Order detail | View order details, update stage, add shipment, add notes, cancel order |
| `/dashboard/orders/[orderId]/invoice` | Order invoice | View/download invoice PDF, print invoice |

### Storefront Builder
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/dashboard/storefront` | Storefront builder | Design storefront with live preview, edit theme (colors, typography, UI), manage sections (hero, text, product grid, banner), configure branding (logo, favicon, banner, social links), set SEO (meta title, description, keywords, OG images), save draft, publish changes |

### Financial & Payouts
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/dashboard/payouts` | Payouts dashboard | View gross/fees/net totals, ledger entries, fee configuration, platform invoices summary |
| `/dashboard/payouts/invoices` | Platform invoices list | View all platform invoices (Smarkitals bills merchant) |
| `/dashboard/payouts/invoices/[invoiceId]` | Platform invoice detail | View invoice details, print invoice |
| `/dashboard/ledger` | Ledger statement | View detailed ledger entries, export CSV statement |
| `/dashboard/billing` | Billing & invoices | View billing summary, download invoice PDF, download statement CSV |

### Settings
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/dashboard/settings` | Settings home | Navigate to all settings sections |
| `/dashboard/settings/store` | Store settings | Edit store name, tagline, description, branding (logo, banner, favicon, colors), contact info, policies (return, refund, shipping, terms, privacy), social links, tracking IDs, operational settings |
| `/dashboard/settings/onboarding` | Onboarding details | Edit PAN details, GST details, contact info (email, phone, website, address), business basics |
| `/dashboard/settings/bank` | Bank account | Add/edit bank account, upload verification documents, view verification status |
| `/dashboard/settings/domain` | Custom domain | Add custom domain, verify domain, activate domain |
| `/dashboard/settings/invoice` | Invoice settings | Configure invoice number prefix, next number, padding, series format, reset financial year option |

## Admin Routes (Requires Super Admin Authentication)

### Admin Dashboard
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin` | Admin dashboard | View platform KPIs (merchants, orders, GMV, fees, pending payouts), recent activity, audit log feed |
| `/admin/sign-in` | Admin sign-in | Authenticate admin user |

### Merchant Management
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin/merchants` | Merchants list | View all merchants, search, filter by status, view stats (orders, products, GMV) |
| `/admin/merchants/[merchantId]` | Merchant detail | View merchant details, stats, account status, toggle active/inactive, view orders/products |
| `/admin/merchants/[merchantId]/pricing` | Merchant pricing | Assign pricing package, set fee overrides, configure payout frequency, holdback, payout hold |
| `/admin/merchants/[merchantId]/billing` | Merchant billing | View merchant billing summary, download invoice PDF, download statement CSV |

### Orders Management
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin/orders` | All orders | View all platform orders, filter by merchant/status/date range |
| `/admin/orders/[orderId]` | Order detail | View order details, merchant info, update order status |

### Payouts & Settlements
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin/payouts` | Payouts list | View all payout batches, filter by status, view settlement cycles |
| `/admin/payouts/[payoutId]` | Payout detail | View payout details, linked invoice, cycle info |
| `/admin/platform-invoices` | Platform invoices | View all platform invoices (Smarkitals bills merchants) |
| `/admin/platform-invoices/[invoiceId]` | Platform invoice detail | View invoice details, line items, merchant info, print invoice |

### Pricing Packages
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin/pricing` | Pricing packages list | View all pricing packages, see merchant count per package |
| `/admin/pricing/new` | Create pricing package | Create new package (name, description, fixed fee, variable fee, domain pricing, payout frequency, holdback, visibility) |
| `/admin/pricing/[id]` | Package detail | View package details, merchant assignments |
| `/admin/pricing/[id]/edit` | Edit package | Update package settings, change status (DRAFT/PUBLISHED/ARCHIVED) |
| `/admin/pricing-packages` | Pricing packages (alternative) | Same as `/admin/pricing` |
| `/admin/pricing-packages/new` | Create package (alternative) | Same as `/admin/pricing/new` |
| `/admin/pricing-packages/[id]/edit` | Edit package (alternative) | Same as `/admin/pricing/[id]/edit` |

### Settings & Configuration
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin/settings` | Admin settings home | Navigate to admin settings sections |
| `/admin/settings/billing` | Platform billing profile | Configure Smarkitals billing profile (legal name, GSTIN, address, invoice numbering, default SAC, GST rate, footer notes) |
| `/admin/settings/admin-users` | Admin users management | Create/edit admin users, assign roles, toggle active status |
| `/admin/settings/roles` | Roles & permissions | Create/edit roles, assign permissions, manage RBAC |
| `/admin/settings/system` | System settings | Configure feature flags (custom domains, payouts, platform invoices), maintenance mode, support contact |
| `/admin/settings/audit-logs` | Audit logs | View admin audit logs, filter by action/entity/actor |

### Other Admin Pages
| Route | Purpose | Major Actions |
|-------|---------|---------------|
| `/admin/domains` | Custom domains | View all custom domains, verify status, manage domain activations |
| `/admin/users` | Platform users | View all users across platform |
| `/admin/payments` | Payments list | View all payments across platform |
| `/admin/audit-logs` | Audit logs (standalone) | Same as `/admin/settings/audit-logs` |

## Route Access Control Summary

### Public (No Auth)
- Landing, sign-in, sign-up, password reset
- Public storefront routes (`/s/[slug]/*`)

### Merchant (Requires Merchant Account)
- All `/dashboard/*` routes
- Requires: `requireMerchant()` - user must have merchant account

### Admin (Requires Super Admin Email)
- All `/admin/*` routes (except `/admin/sign-in`)
- Requires: `requireSuperAdmin()` - email must be in `SUPER_ADMIN_EMAILS` env var
- Protected by: `app/admin/(protected)/layout.tsx`

## Special Route Features

### Preview Mode
- `/s/[slug]?preview=true` - Shows draft storefront config (merchant ownership verified)

### Custom Domain Routing
- Custom domains resolve to merchant storefront via middleware
- Domain must be verified and active

### Export Features
- `/dashboard/orders` - Export orders CSV, export order items CSV
- `/dashboard/ledger` - Export ledger statement CSV
- `/dashboard/billing` - Download invoice PDF, download statement CSV

### Invoice Generation
- Order invoices: `/dashboard/orders/[orderId]/invoice` - On-demand PDF generation
- Platform invoices: `/dashboard/payouts/invoices/[invoiceId]` - Weekly generated invoices

## Notes

- All merchant routes enforce tenant isolation (scoped by `merchantId`)
- All admin routes require super admin email allowlist
- Storefront routes are public but check `isStoreLive` and `accountStatus`
- Preview routes verify merchant ownership before showing draft config
- Invoice routes generate PDFs on-demand using PDFKit
- Export routes generate CSV files on-demand
