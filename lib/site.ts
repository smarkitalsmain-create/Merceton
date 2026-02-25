export function getBaseUrl(): URL {
  // Prefer explicit app URL if provided
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      return new URL(appUrl)
    } catch {
      // fall through to other strategies
    }
  }

  // Vercel-provided URL (e.g. my-app.vercel.app)
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    try {
      return new URL(`https://${vercelUrl}`)
    } catch {
      // ignore and fallback
    }
  }

  // Local development fallback
  return new URL("http://localhost:3000")
}

/**
 * Origin URL for redirects (e.g. emailRedirectTo). Prefers NEXT_PUBLIC_SITE_URL,
 * then NEXT_PUBLIC_APP_URL, then client window.location.origin, then getBaseUrl().
 * Use this instead of window.location.origin to avoid localhost in production.
 */
export function getSiteUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) {
    try {
      return new URL(site).origin
    } catch {
      // fall through
    }
  }
  const app = process.env.NEXT_PUBLIC_APP_URL
  if (app) {
    try {
      return new URL(app).origin
    } catch {
      // fall through
    }
  }
  if (typeof window !== "undefined") return window.location.origin
  return getBaseUrl().origin
}

