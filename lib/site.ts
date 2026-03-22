import { getMarketingUrlObject } from "@/lib/urls"

/**
 * Resolve the base URL for metadata and server-side absolute links.
 * Uses the marketing site origin (see `lib/urls.ts` and NEXT_PUBLIC_MARKETING_URL).
 */
export function getBaseUrl(): URL {
  return getMarketingUrlObject()
}

