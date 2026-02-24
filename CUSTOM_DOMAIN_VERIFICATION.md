# Custom Domain Verification - Production Implementation

## Status: ✅ COMPLETE

This document describes the production-grade custom domain verification system that replaces the mocked implementation.

## Features Implemented

### 1. Database Schema ✅

**Updated `prisma/schema.prisma`:**
- Added `FAILED` to `DomainStatus` enum
- Added unique constraint on `customDomain` (prevents collisions)
- Added `DomainClaim` model for audit trail and history

**Domain Status Lifecycle:**
- `PENDING` → Domain added, awaiting verification
- `VERIFIED` → DNS TXT record verified, domain ready
- `ACTIVE` → Domain fully active (future: after SSL provisioning)
- `FAILED` → Verification failed (can retry)

### 2. Domain Normalization ✅

**File:** `lib/domains/normalize.ts`

- Normalizes domain input:
  - Lowercase conversion
  - Protocol removal (http://, https://)
  - www. prefix removal
  - Trailing slash removal
  - Path/query/fragment removal
- Validates domain format
- Generates verification record name: `_merceton-verify.<domain>`

### 3. API Endpoints ✅

#### POST `/api/domains/add`
- Validates and normalizes domain input
- Checks for platform domain conflicts
- Enforces unique domain constraint
- Generates verification token (32-char hex)
- Creates domain claim record
- Returns DNS instructions with correct record name: `_merceton-verify.<domain>`

#### POST `/api/domains/verify`
- **Real DNS lookup** using `dns.promises.resolveTxt`
- Looks up `_merceton-verify.<domain>` TXT record
- Compares token from DNS with stored token
- Updates status:
  - `VERIFIED` if token matches
  - `FAILED` if token doesn't match or DNS lookup fails
- Returns detailed error messages for troubleshooting

#### POST `/api/domains/disconnect`
- Removes custom domain from merchant
- Updates domain claim records (marks as released)
- Clears verification token and status

### 4. UI Updates ✅

**File:** `components/DomainSettingsForm.tsx`

- Status badges: PENDING, VERIFIED, ACTIVE, FAILED
- DNS verification instructions with step-by-step guide
- Correct TXT record name: `_merceton-verify.<domain>`
- Verify button for PENDING and FAILED statuses
- VERIFIED state shows:
  - Success message
  - Next steps (DNS A/CNAME configuration)
  - SSL provisioning notice (doesn't claim it's done)
- Error handling with detailed messages

### 5. Middleware Routing ✅

**File:** `middleware.ts`

- Detects custom domain in host header
- Looks up merchant by `customDomain` (with 5-minute cache)
- Routes to storefront (`/s/<slug>`) if:
  - Domain status is VERIFIED or ACTIVE
  - Merchant is active
  - Account status is ACTIVE
- Maintains tenant isolation
- In-memory caching to reduce DB load (consider Redis for production)

### 6. Tests ✅

**Unit Tests:** `tests/unit/domainNormalize.test.ts`
- Domain normalization
- Format validation
- Verification record name generation

**Integration Tests:** `tests/integration/domainVerify.test.ts`
- DNS lookup mocking
- Token matching logic
- Error handling

**E2E Tests:** `tests/e2e/domain-verification.spec.ts`
- Add domain flow
- DNS instructions display
- Status updates

## Domain Verification Flow

1. **Merchant adds domain:**
   - Enters domain (e.g., "brandname.com")
   - System normalizes to "brandname.com"
   - Generates token: "abc123def456..."
   - Status: `PENDING`

2. **DNS Configuration:**
   - Merchant adds TXT record:
     - Name: `_merceton-verify.brandname.com`
     - Value: `abc123def456...`

3. **Verification:**
   - Merchant clicks "Verify Domain"
   - System performs DNS lookup
   - Compares token
   - If match → Status: `VERIFIED`
   - If mismatch → Status: `FAILED` (can retry)

4. **Routing:**
   - Once VERIFIED, middleware routes `brandname.com` → `/s/<merchant-slug>`
   - Storefront served on custom domain

## DNS Record Format

```
Type: TXT
Name: _merceton-verify.brandname.com
Value: <32-character-hex-token>
```

## API Response Examples

### Add Domain Success
```json
{
  "merchant": {
    "id": "...",
    "customDomain": "brandname.com",
    "domainStatus": "PENDING",
    "domainVerificationToken": "abc123...",
    "domainVerifiedAt": null
  },
  "dnsInstructions": {
    "type": "TXT",
    "name": "_merceton-verify.brandname.com",
    "value": "abc123..."
  },
  "message": "Domain saved. Please add the DNS TXT record to verify."
}
```

### Verify Success
```json
{
  "verified": true,
  "merchant": {
    "domainStatus": "VERIFIED",
    "domainVerifiedAt": "2024-01-01T12:00:00Z"
  },
  "message": "Domain verification successful. Your domain is now verified and ready to use."
}
```

### Verify Failure (DNS not found)
```json
{
  "verified": false,
  "error": "DNS TXT record not found. Please ensure you've added the TXT record: _merceton-verify.brandname.com = abc123.... DNS changes may take a few minutes to propagate.",
  "recordName": "_merceton-verify.brandname.com",
  "expectedToken": "abc123..."
}
```

### Verify Failure (Token mismatch)
```json
{
  "verified": false,
  "error": "Verification token mismatch. Found records: wrong-token. Expected: abc123.... Please ensure the TXT record value exactly matches the token.",
  "recordName": "_merceton-verify.brandname.com",
  "expectedToken": "abc123...",
  "foundRecords": ["wrong-token"]
}
```

## Security Features

- ✅ Unique domain constraint (prevents collisions)
- ✅ Token-based verification (cryptographically random)
- ✅ Server-side DNS validation (cannot be bypassed)
- ✅ Tenant isolation (middleware ensures correct merchant)
- ✅ Domain claim audit trail

## Migration Steps

1. **Run Prisma migration:**
   ```bash
   npx prisma migrate dev --name add_domain_verification
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run tests:**
   ```bash
   npm run test:unit
   npm run test:integration
   ```

## Environment Variables

No new environment variables required. Uses existing:
- `PLATFORM_DOMAINS` (optional, comma-separated list of platform domains to block)

## Files Created/Modified

### New Files
- `lib/domains/normalize.ts` - Domain normalization utilities
- `tests/unit/domainNormalize.test.ts` - Unit tests
- `tests/integration/domainVerify.test.ts` - Integration tests
- `CUSTOM_DOMAIN_VERIFICATION.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added FAILED status, unique constraint, DomainClaim model
- `app/api/domains/add/route.ts` - Updated normalization, correct record name, domain claims
- `app/api/domains/verify/route.ts` - **Replaced mock with real DNS lookup**
- `app/api/domains/disconnect/route.ts` - Created (moved from `/api/domain/disconnect`)
- `components/DomainSettingsForm.tsx` - Updated UI, correct endpoints, status handling
- `middleware.ts` - Added custom domain routing with caching

## Removed Mock Code

- ❌ Removed: Mock verification that just checked if token exists
- ✅ Added: Real DNS TXT lookup using Node.js `dns` module
- ✅ Added: Token comparison logic
- ✅ Added: Detailed error messages

## Next Steps (Future Enhancements)

- [ ] SSL certificate provisioning automation
- [ ] Automatic status transition: VERIFIED → ACTIVE (after SSL)
- [ ] Domain health monitoring
- [ ] Domain expiration reminders
- [ ] Bulk domain management (admin)

## Notes

- DNS propagation can take 2-5 minutes (sometimes longer)
- Verification can be retried if it fails
- Domain must be VERIFIED or ACTIVE for routing to work
- SSL provisioning is shown as "in progress" (not claimed as done)
