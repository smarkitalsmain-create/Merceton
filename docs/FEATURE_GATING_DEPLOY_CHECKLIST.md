# Feature Gating — Deploy Checklist (Growth-only, zero duplicates)

## Canonical Growth features (9 only)

- **Storefront:** G_CUSTOM_DOMAIN, G_REMOVE_BRANDING, G_ADV_THEME  
- **Catalog:** G_UNLIMITED_PRODUCTS, G_PRODUCT_VARIANTS  
- **Marketing:** G_COUPONS, G_ABANDONED_CART_EMAIL  
- **Analytics:** G_ADV_ANALYTICS  
- **Support:** G_PRIORITY_SUPPORT  

Starter = baseline (no feature checkboxes). Ledger export and Support tickets = baseline (no gating). No WhatsApp feature.

---

## Local

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run lint
npm run check:types
npm run build
npm run dev
```

## Production (Neon)

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

Then deploy the app (e.g. Vercel) with `DATABASE_URL` and `DIRECT_URL` set.

---

## Verify

- **Admin:** `/admin/pricing` → Pricing Packages in sidebar. `/admin/pricing/new` → 9 Growth feature checkboxes only. Create package and select features → save persists.
- **Merchant (Starter):** No Custom Domain or Coupons in sidebar; Support and Payouts visible; Analytics page shows basic CTA only.
- **Merchant (Growth):** Custom Domain, Coupons, advanced analytics widgets visible when package has those features.
- **APIs:** 403 with `featureKey` for gated endpoints (domains, coupons, advanced analytics).
