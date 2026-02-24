## E2E Tests

Playwright E2E tests exercise critical auth and routing flows against a running Next.js app.

### Environment variables

These variables control how tests run:

- **`E2E_BASE_URL`**: Base URL for the app under test (defaults to `http://127.0.0.1:3000`).
- **`E2E_MERCHANT_EMAIL`**: Merchant test user email.
- **`E2E_MERCHANT_PASSWORD`**: Merchant test user password.
- **`E2E_ADMIN_EMAIL`**: Admin test user email.
- **`E2E_ADMIN_PASSWORD`**: Admin test user password.

Notes:
- The redirect test (`/dashboard` → sign-in) always runs.
- Merchant/admin login tests **auto-skip** if the corresponding `E2E_*` credentials are not set.

### Running tests

```bash
# Run all E2E tests (auto-starts dev server if needed)
npm run test:e2e

# Run in headed mode
npm run test:e2e:headed

# Run Playwright UI mode
npm run test:e2e:ui
```

### Server startup

Playwright is configured to:

- Start the Next.js dev server with `npm run dev -- --port 3000` if one is not already running.
- Reuse an existing server locally (`reuseExistingServer: !CI`).
- Use `E2E_BASE_URL` (or `http://127.0.0.1:3000`) as `baseURL`, so tests use relative URLs like `page.goto("/dashboard")`.
