/**
 * Middleware for session refresh and hostname-based routing
 * 
 * Handles:
 * - Session refresh for protected routes (cookie writes allowed here)
 * - Hostname-based routing for app.* and admin.* subdomains
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { prisma } from "@/lib/prisma"
import { normalizeDomain } from "@/lib/domains/normalize"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Simple in-memory cache for custom domain lookups (TTL: 5 minutes)
// In production, consider using Redis or similar for distributed caching
const domainCache = new Map<string, { merchant: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getMerchantByDomain(domain: string) {
  // Check cache first
  const cached = domainCache.get(domain)
  if (cached && cached.expires > Date.now()) {
    return cached.merchant
  }

  // Cache miss - query database
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { customDomain: domain },
      select: {
        id: true,
        slug: true,
        domainStatus: true,
        isActive: true,
        accountStatus: true,
      },
    })

    // Cache result (even if null)
    domainCache.set(domain, {
      merchant,
      expires: Date.now() + CACHE_TTL,
    })

    return merchant
  } catch (error) {
    console.error("Error looking up merchant by domain:", error)
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url)
  const host = req.headers.get("host") || ""

  // Handle custom domain routing (before other routing logic)
  // Check if host matches a merchant's custom domain
  if (host && !host.startsWith("admin.") && !host.startsWith("app.")) {
    try {
      const normalizedHost = normalizeDomain(host)
      
      // Check if this is a custom domain (with caching)
      const merchant = await getMerchantByDomain(normalizedHost)

      // Route to storefront if domain is verified/active and merchant is active
      if (
        merchant &&
        (merchant.domainStatus === "VERIFIED" || merchant.domainStatus === "ACTIVE") &&
        merchant.isActive &&
        merchant.accountStatus === "ACTIVE"
      ) {
        // Rewrite to storefront route with merchant slug
        const storefrontPath = `/s/${merchant.slug}${pathname === "/" ? "" : pathname}`
        return NextResponse.rewrite(new URL(storefrontPath, req.url))
      }
    } catch (error) {
      // If domain normalization fails, continue with normal routing
      // (DB lookup errors are handled in getMerchantByDomain)
      if (process.env.NODE_ENV === "development") {
        console.error("Custom domain routing error:", error)
      }
    }
  }

  // Redirect old /_app/* routes to new routes
  if (pathname.startsWith("/_app")) {
    const newPath = pathname.replace("/_app", "")
    // Map common routes
    if (newPath === "/sign-in" || newPath === "") {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }
    if (newPath === "/sign-up") {
      return NextResponse.redirect(new URL("/sign-up", req.url))
    }
    if (newPath === "/dashboard" || newPath.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(newPath, req.url))
    }
    if (newPath === "/auth/callback") {
      return NextResponse.redirect(new URL("/auth/callback", req.url))
    }
    if (newPath === "/forgot-password") {
      return NextResponse.redirect(new URL("/forgot-password", req.url))
    }
    if (newPath === "/reset-password") {
      return NextResponse.redirect(new URL("/reset-password", req.url))
    }
    // Default redirect to sign-in for unknown /_app routes
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  // Never touch API routes, Next.js internals, or static assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  ) {
    return NextResponse.next()
  }

  // Determine if this is a protected route
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_admin")
  
  // Determine cookie path based on hostname
  let cookiePath = "/"
  if (host.startsWith("admin.")) {
    cookiePath = "/_admin"
  } else if (host.startsWith("app.")) {
    cookiePath = "/_app"
  }

  // Create response (will be used for rewrite or next)
  let response: NextResponse

  // Handle hostname-based routing for subdomains
  // For app.* subdomain, routes work the same (no rewrite needed)
  // For admin.* subdomain, rewrite to /_admin/* for isolation
  if (host.startsWith("admin.")) {
    const rewritePath = `/_admin${pathname === "/" ? "" : pathname}`
    response = NextResponse.rewrite(new URL(rewritePath, req.url))
  } else {
    // For app.* subdomain or regular localhost, use routes as-is
    response = NextResponse.next()
  }

  // Refresh session and enforce auth for protected routes (cookie writes allowed in middleware)
  if (isProtectedRoute) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options, path: cookiePath })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options, path: cookiePath })
        },
      },
    })

    // Trigger session refresh and get current user (updates cookies in response)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If not authenticated, redirect to sign-in with ?next=<path>
    if (!user) {
      const redirectUrl = new URL("/sign-in", req.url)
      redirectUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/_admin/:path*",
    // Also match all routes for hostname-based rewrites
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
