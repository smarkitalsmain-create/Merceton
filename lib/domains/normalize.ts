/**
 * Domain Normalization Utilities
 * 
 * Normalizes domain input to consistent format:
 * - Lowercase
 * - Strip protocol (http://, https://)
 * - Strip www. prefix
 * - Remove trailing slash
 * - Remove path/query/fragment
 */

/**
 * Normalize domain string
 * @param domain - Raw domain input
 * @returns Normalized domain (e.g., "example.com")
 */
export function normalizeDomain(domain: string): string {
  if (!domain || typeof domain !== "string") {
    throw new Error("Domain must be a non-empty string")
  }

  let normalized = domain.trim().toLowerCase()

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, "")

  // Remove www. prefix
  normalized = normalized.replace(/^www\./, "")

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "")

  // Remove path, query, fragment (take only domain part)
  normalized = normalized.split("/")[0].split("?")[0].split("#")[0]

  // Remove port if present (for localhost testing)
  if (normalized.includes(":") && !normalized.startsWith("[")) {
    // IPv6 addresses are in brackets, don't split those
    normalized = normalized.split(":")[0]
  }

  return normalized
}

/**
 * Validate domain format
 * Basic validation - checks for valid domain structure
 * @param domain - Normalized domain
 * @returns true if valid format
 */
export function isValidDomainFormat(domain: string): boolean {
  if (!domain || domain.length === 0) {
    return false
  }

  // Basic domain regex: alphanumeric, dots, hyphens
  // Must have at least one dot (TLD)
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/

  return domainRegex.test(domain)
}

/**
 * Get DNS TXT record name for verification
 * @param domain - Normalized domain
 * @returns TXT record name (e.g., "_merceton-verify.example.com")
 */
export function getVerificationRecordName(domain: string): string {
  return `_merceton-verify.${domain}`
}
