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

