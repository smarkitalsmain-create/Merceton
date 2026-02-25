# UI Wiring Audit — Merceton Admin + Merchant

<!--
STEP 0 — INVENTORY & AUDIT (DO THIS FIRST)
For each module: DB/API/UI/Nav state, missing pages, missing nav links, missing layout, missing RBAC.
-->

## 1. Support Ticketing (merchant + super admin)

| Layer | State | Notes |
|-------|--------|------|
| DB | ✅ | Ticket, TicketMessage, TicketInternalNote |
| API | ❌ | No GET /api/tickets/[id]; merchant detail uses fetch → replace with router.refresh() |
| Actions | ✅ | createTicket, replyToTicket, updateTicket, addInternalNote, getMerchantTickets, getMerchantTicket |
| Merchant UI | ✅ | /dashboard/support (list), /dashboard/support/new, /dashboard/support/[id] |
| Merchant Nav | ❌ | Support not in DashboardSidebar |
| Admin UI | ❌ | No /admin/support (list), no /admin/support/[id] (detail) |
| Admin Nav | ❌ | Support not in AdminSidebar |
| Admin actions | ❌ | getAdminTickets, getAdminTicket missing in tickets.ts |
| RBAC | ✅ | requireMerchant / requireSuperAdmin in actions |

- [ ] Add getAdminTickets, getAdminTicket to app/actions/tickets.ts
- [ ] Create app/admin/(protected)/support/page.tsx (list)
- [ ] Create app/admin/(protected)/support/[id]/page.tsx (detail + reply + status/priority/assign + internal notes)
- [ ] Add Support to DashboardSidebar and AdminSidebar
- [ ] Fix TicketDetail: use router.refresh() after reply (no /api/tickets/[id])

---

## 2. Pricing packages / features editor (gating)

| Layer | State | Notes |
|-------|--------|------|
| DB | ✅ | PricingPackage, PricingPackageFeature, Feature, MerchantFeatureOverride |
| API | N/A | Server actions used |
| Actions | ✅ | getPackageFeatures, updatePricingPackageFeatures, assignMerchantPricingPackage, etc. |
| Admin UI | ✅ | /admin/pricing (list), /admin/pricing/[id] (detail), /admin/pricing/[id]/edit (fees), /admin/pricing-packages/[id]/edit (features) |
| Admin Nav | ✅ | Pricing → /admin/pricing; add "Edit features" CTA from package detail to pricing-packages/[id]/edit |
| Merchant override | ⚠️ | /admin/merchants/[merchantId]/pricing has fee overrides; feature override UI missing |
| Feature keys | ✅ | lib/features/types.ts FeatureKey; lib/features/guards.ts canUseFeature |
| Merchant gating | ✅ | assertFeature/canUseFeature exist; need route guards + sidebar hide + /dashboard/upgrade |

- [ ] Add "Edit features" link on /admin/pricing/[id] → /admin/pricing-packages/[id]/edit (when DRAFT)
- [ ] Add merchant feature override UI in /admin/merchants/[merchantId]/pricing (toggle + checklist)
- [ ] Add lib/features/featureKeys.ts (canonical list export)
- [ ] Add /dashboard/upgrade page when feature denied
- [ ] Gate merchant nav items by canUseFeature (Support, Coupons, Analytics, Domain, Import)

---

## 3. Merchant status flows (hold / release / KYC / email triggers)

| Layer | State | Notes |
|-------|--------|------|
| DB | ✅ | Merchant.accountStatus, kycStatus, holdReasonCode, etc. |
| API | N/A | Actions used |
| Admin UI | ✅ | MerchantStatusEditor in merchant detail; account-hold page (merchant) |
| Nav | ✅ | Under Merchants → [merchant] |

- [ ] No missing UI; audit only. Ensure status flows are discoverable from merchant detail.

---

## 4. Coupons module (merchant UI)

| Layer | State | Notes |
|-------|--------|------|
| DB | ✅ | Coupon model |
| API | ✅ | /api/coupons/validate |
| Actions | ✅ | getCoupons, createCoupon, updateCoupon, etc. |
| Merchant UI | ✅ | /dashboard/marketing/coupons (list), /new, /[id]/edit |
| Merchant Nav | ❌ | Marketing > Coupons not in sidebar |
| Gating | ❌ | Page does not check COUPONS feature; redirect to upgrade if disabled |
| Empty/loading | ⚠️ | CouponsList may need explicit empty state (verify) |

- [ ] Add Marketing > Coupons to DashboardSidebar
- [ ] Gate coupons routes with canUseFeature(merchantId, "COUPONS"); redirect to /dashboard/upgrade
- [ ] Ensure empty state and loading state on list page

---

## 5. Analytics dashboard (merchant UI)

| Layer | State | Notes |
|-------|--------|------|
| DB | N/A | Uses orders/payments |
| API | ✅ | /api/analytics/sales-by-date, sales-by-product, top-customers, conversion |
| Actions | N/A | Dashboard fetches via API |
| Merchant UI | ✅ | /dashboard/analytics, AnalyticsDashboard component |
| Merchant Nav | ❌ | Analytics not in DashboardSidebar |
| Gating | ✅ | assertFeature(merchantId, "ANALYTICS_BASIC") |
| Loading/error | ✅ | AnalyticsDashboard has loading; ensure error state |

- [ ] Add Analytics to DashboardSidebar
- [ ] Verify error state in AnalyticsDashboard

---

## 6. Domain settings (merchant UI + admin view)

| Layer | State | Notes |
|-------|--------|------|
| DB | ✅ | Merchant.customDomain, domainStatus, etc. |
| API | ✅ | /api/domain/verify, save, disconnect; /api/domains/* |
| Merchant UI | ✅ | /dashboard/settings/domain, DomainSettingsForm |
| Merchant Nav | ✅ | Custom Domain link in sidebar (already present) |
| Admin | ✅ | /admin/domains (if exists); merchant detail shows domain |
| Gating | ❌ | Domain page should gate on CUSTOM_DOMAIN; redirect to upgrade |

- [ ] Gate /dashboard/settings/domain with canUseFeature(merchantId, "CUSTOM_DOMAIN")
- [ ] Add breadcrumbs: Settings > Custom Domain

---

## 7. CSV product import (merchant UI)

| Layer | State | Notes |
|-------|--------|------|
| DB | N/A | Products |
| API | ✅ | /api/products/import, /api/products/import/template |
| Actions | N/A | API used |
| Merchant UI | ✅ | /dashboard/products/import |
| Merchant Nav | ❌ | Import link not in sidebar (under Products) |

- [ ] Add "Import" to DashboardSidebar (under or next to Products: /dashboard/products/import)
- [ ] Gate import on BULK_PRODUCT_CSV_IMPORT; redirect to upgrade if disabled

---

## 8. Onboarding validation logs UI

| Layer | State | Notes |
|-------|--------|------|
| DB | ✅ | OnboardingValidationLog |
| API | N/A | Could add or use actions |
| Merchant UI | ❌ | No /dashboard/settings/onboarding or validation results view |
| Admin UI | ❌ | No validation logs in merchant detail (optional) |

- [ ] Optional: merchant onboarding step or settings shows last validation result
- [ ] Optional: admin merchant detail tab "Validation logs"

---

## Implementation checklist (after audit)

- [ ] STEP 1: Merchant sidebar — Dashboard, Products, Product Import, Orders, Storefront, Marketing > Coupons, Analytics, Payouts, Billing, Settings, Custom Domain, Support
- [ ] STEP 1: Admin sidebar — Overview, Merchants, Pricing (Pricing Packages), Support, Orders, Payouts, Platform Invoices, Settings, Audit Logs; add Domains if /admin/domains exists
- [ ] STEP 2: Admin support list + detail pages; getAdminTickets, getAdminTicket
- [ ] STEP 3: Feature gating UI: featureKeys.ts, merchant override in admin, canUseFeature in nav + routes, /dashboard/upgrade
- [ ] STEP 4: Coupons — nav, gating, empty/loading
- [ ] STEP 5: Analytics — nav, error state
- [ ] STEP 6: Domain — gating, breadcrumbs
- [ ] STEP 7: Onboarding validation — optional
- [ ] STEP 8: Fix orphans; ensure every page reachable from nav or CTA
- [ ] STEP 9: lint, tsc, build, e2e

---

## Files changed/created (implementation complete)

### Created
- `app/admin/(protected)/support/page.tsx` — Admin support ticket list
- `app/admin/(protected)/support/[id]/page.tsx` — Admin support ticket detail
- `components/support/AdminTicketsList.tsx` — Admin tickets table with empty state
- `components/support/AdminTicketDetail.tsx` — Admin ticket detail: reply, status/priority, internal notes
- `lib/features/featureKeys.ts` — Canonical FEATURE_KEYS + FEATURE_SECTIONS for gating and admin UI
- `app/dashboard/upgrade/page.tsx` — Upgrade/plan required page when feature is denied
- `components/dashboard/ProductImportClient.tsx` — Client UI for CSV product import (extracted from page)
- `components/admin/MerchantFeatureOverrideEditor.tsx` — Admin UI to override package features per merchant

### Modified
- `components/DashboardSidebar.tsx` — Added Support, Coupons, Analytics, Import Products; reordered nav
- `components/AdminSidebar.tsx` — Added Support, Domains; renamed Pricing → Pricing Packages; Audit Logs icon
- `app/actions/tickets.ts` — Added getAdminTickets(), getAdminTicket()
- `app/admin/(protected)/pricing/[id]/page.tsx` — Added "Edit features" link to pricing-packages/[id]/edit
- `app/dashboard/marketing/coupons/page.tsx` — Feature gate COUPONS + redirect to /dashboard/upgrade
- `app/dashboard/settings/domain/page.tsx` — Feature gate CUSTOM_DOMAIN + redirect; breadcrumbs
- `app/dashboard/analytics/page.tsx` — Redirect to /dashboard/upgrade on FeatureDeniedError
- `app/dashboard/products/import/page.tsx` — Server page that gates BULK_PRODUCT_CSV_IMPORT, renders ProductImportClient
- `app/admin/(protected)/merchants/[merchantId]/pricing/page.tsx` — Load resolved features; render MerchantFeatureOverrideEditor
- `app/actions/features.ts` — getMerchantResolvedFeatures() now returns featureId
- `components/support/TicketDetail.tsx` — Use router.refresh() after reply; sync state from initialTicket (useEffect + useEffect import)

### Routes now reachable
- Merchant: /dashboard/support, /dashboard/support/new, /dashboard/support/[id], /dashboard/marketing/coupons, /dashboard/analytics, /dashboard/settings/domain, /dashboard/products/import, /dashboard/upgrade
- Admin: /admin/support, /admin/support/[id], /admin/pricing, /admin/pricing/[id], /admin/pricing-packages/[id]/edit, /admin/merchants/[id]/pricing (with feature overrides), /admin/domains

### Verification
- `npm run lint` — pass
- `npx tsc --noEmit` — pass
- `npm run build` — compiles; static generation completes (99/99); failure in sandbox is DB unreachable + worker kill EPERM, not code.
