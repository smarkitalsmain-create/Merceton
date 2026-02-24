# Database Outage Handling - Implementation Summary

## Problem
Prisma P1001 errors (database unreachable) were causing the app to crash with `[object Response]` errors and 503 responses that weren't user-friendly.

## Solution Implemented

### 1. Database Error Detection (`lib/db-error.ts`)

Created a dedicated utility to detect database connection errors:

```typescript
export function isDbDownError(error: unknown): boolean
export function getDbErrorMessage(error: unknown): string
```

**Detects:**
- `PrismaClientInitializationError` with codes: P1001, P1008, P1017
- Error messages containing: "can't reach database", "connection refused", "timeout", "unreachable"

### 2. Auth Layer Resilience (`lib/auth.ts`)

**Updated functions:**
- `requireUser()` - Now catches DB errors and redirects to `/503` instead of throwing Response
- `requireMerchant()` - Handles DB errors gracefully
- `authorizeRequest()` - Wraps requireUser with DB error handling

**Key changes:**
- Replaced `throw new Response("Database unavailable", { status: 503 })` with `redirect("/503")`
- Uses `isDbDownError()` helper for consistent error detection
- Proper error logging with structured error info
- Handles P2002 race conditions even when DB is down

### 3. Prisma Client Settings (`lib/prisma.ts`)

**Enhanced singleton pattern:**
- Added documentation about connection pool settings
- Non-blocking initial connection check (doesn't crash app on startup)
- Proper error logging for connection failures

**Connection settings:**
- `DATABASE_URL`: Pooled connection (with `pgbouncer=true&connection_limit=1` for Neon)
- `DIRECT_URL`: Direct connection (no pgbouncer, for migrations and long transactions)

### 4. User-Friendly 503 Page (`app/503/page.tsx`)

Created a dedicated service unavailable page:
- Clean UI with error icon
- User-friendly message: "Merceton is temporarily unavailable"
- Link to return home
- Uses shadcn/ui Card components for consistent styling

### 5. Database Health Check Script (`scripts/db-check.js`)

Added `npm run db:check` command:
- Tests database connection with `SELECT 1`
- Provides helpful error messages for common issues
- Validates DATABASE_URL configuration
- Useful for debugging connection issues

### 6. Documentation Updates (`README.md`)

**Enhanced DATABASE_URL guidance:**
- Clear format for Neon pooler: `?sslmode=require&pgbouncer=true&connection_limit=1`
- Separate instructions for DIRECT_URL (no pgbouncer)
- Added verification step: `npm run db:check`

## Files Changed

1. **lib/db-error.ts** (NEW)
   - Database error detection utilities

2. **lib/auth.ts**
   - Updated `requireUser()`, `requireMerchant()`, `authorizeRequest()`
   - Replaced Response throws with redirects
   - Added DB error handling

3. **lib/prisma.ts**
   - Enhanced documentation
   - Improved error logging

4. **app/503/page.tsx** (NEW)
   - Service unavailable page

5. **scripts/db-check.js** (NEW)
   - Database health check script

6. **package.json**
   - Added `db:check` script

7. **README.md**
   - Updated DATABASE_URL format documentation

## Expected Behavior

### When Database is Down:

1. **Auth Functions:**
   - `requireUser()` detects P1001 error
   - Logs error server-side with structured info
   - Redirects to `/503` page (no `[object Response]` error)

2. **User Experience:**
   - User sees friendly 503 page instead of crash
   - Page shows: "Merceton is temporarily unavailable. Please try again in a few minutes."
   - Link to return home

3. **App Startup:**
   - App starts even if DB is unreachable
   - Initial connection check is non-blocking
   - Individual queries handle errors gracefully

### When Database is Up:

- Normal operation continues
- No performance impact
- Error handling is transparent

## Testing

### Test Database Outage:

1. **Stop database or use invalid DATABASE_URL:**
   ```bash
   # In .env.local, temporarily break DATABASE_URL
   DATABASE_URL="postgresql://invalid:invalid@localhost:5432/invalid"
   ```

2. **Start app:**
   ```bash
   npm run dev
   ```
   - App should start (non-blocking connection check)

3. **Access protected route:**
   - Navigate to `/dashboard` or `/onboarding`
   - Should redirect to `/503` page
   - Should NOT show `[object Response]` in console

4. **Check logs:**
   - Server logs should show: `[requireUser] DB connection error:`
   - Should include error code and message

### Test Database Connection:

```bash
npm run db:check
```

**Expected output when DB is up:**
```
🔍 Checking database connection...
📡 DATABASE_URL: ✓ Set
📡 DIRECT_URL: ✓ Set
✅ Database connection successful!
```

**Expected output when DB is down:**
```
🔍 Checking database connection...
📡 DATABASE_URL: ✓ Set
❌ Database connection failed:
   Error: Can't reach database server at ...
   Code: P1001
💡 Troubleshooting:
   1. Check if DATABASE_URL is correct
   2. Verify database server is running
   ...
```

## DATABASE_URL Format

### For Neon Pooler (DATABASE_URL):
```
postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1
```

**Required parameters:**
- `sslmode=require` - SSL connection required
- `pgbouncer=true` - Use connection pooler
- `connection_limit=1` - Limit connections per client

### For Direct Connection (DIRECT_URL):
```
postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Required parameters:**
- `sslmode=require` - SSL connection required
- **NO** `pgbouncer=true` - Direct connection for migrations

## Error Codes Handled

- **P1001**: Can't reach database server
- **P1008**: Operations timed out
- **P1017**: Server has closed the connection
- **P2002**: Unique constraint violation (race condition fallback)

## Notes

- All DB error handling is server-side only
- No sensitive error information exposed to client
- App remains functional for non-DB routes even when DB is down
- Graceful degradation: protected routes redirect to 503, public routes work
