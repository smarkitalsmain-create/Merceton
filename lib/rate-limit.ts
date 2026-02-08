/**
 * Simple in-memory rate limiting for MVP
 * For production, consider using Redis or a dedicated service
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

/**
 * Simple rate limiter
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now()
  const key = identifier

  // Clean up expired entries
  if (store[key] && store[key].resetAt < now) {
    delete store[key]
  }

  // Initialize or get existing entry
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    }
    return true
  }

  // Check if limit exceeded
  if (store[key].count >= maxRequests) {
    return false
  }

  // Increment count
  store[key].count++
  return true
}

/**
 * Get rate limit info for an identifier
 */
export function getRateLimitInfo(identifier: string): {
  remaining: number
  resetAt: number
} | null {
  const entry = store[identifier]
  if (!entry) {
    return null
  }

  return {
    remaining: Math.max(0, 10 - entry.count), // Assuming max 10
    resetAt: entry.resetAt,
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || realIp || "unknown"

  return ip
}
