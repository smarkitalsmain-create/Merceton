/**
 * Generate full store URL from merchant slug
 * Uses environment variable for base domain or defaults to merceton.com
 */
export function getStoreUrl(slug: string): string {
  const baseDomain =
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "merceton.com"
  return `https://${slug}.${baseDomain}`
}
