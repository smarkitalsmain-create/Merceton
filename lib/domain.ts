import { prisma } from "@/lib/prisma"

/**
 * Normalize hostname for domain matching
 * - Remove port (localhost:3001 -> localhost)
 * - Remove www. prefix
 * - Lowercase
 * - Strip trailing dot
 */
export function normalizeHost(host: string): string {
  // Remove port if present
  let normalized = host.split(":")[0]
  // Remove www. prefix
  normalized = normalized.replace(/^www\./i, "")
  // Lowercase and trim
  normalized = normalized.toLowerCase().trim()
  // Remove trailing dot
  return normalized.replace(/\.$/, "")
}

/**
 * Check if host is a platform domain (not a custom merchant domain)
 */
function isPlatformDomain(host: string): boolean {
  const platformDomains = process.env.PLATFORM_DOMAINS?.split(",").map((d) =>
    normalizeHost(d.trim())
  ) || ["localhost", "127.0.0.1"]

  const normalizedHost = normalizeHost(host)
  return platformDomains.includes(normalizedHost)
}

/**
 * Resolve merchant from custom domain hostname
 * Returns null if:
 * - Host is a platform domain (localhost, *.vercel.app)
 * - No merchant found with that custom domain
 * - Merchant domain status is not VERIFIED
 */
export async function resolveMerchantFromHost(host: string) {
  // If it's a platform domain, return null (use regular /s/[slug] routing)
  if (isPlatformDomain(host)) {
    return null
  }

  // Ignore Vercel preview domains
  if (host.includes(".vercel.app")) {
    return null
  }

  const normalizedHost = normalizeHost(host)

  // Look up merchant by custom domain
  const merchant = await prisma.merchant.findFirst({
    where: { customDomain: normalizedHost },
    include: {
      storefront: true,
    },
  })

  // Only return if domain is ACTIVE and merchant is active
  if (merchant && merchant.domainStatus === "ACTIVE" && merchant.isActive) {
    return merchant
  }

  return null
}
