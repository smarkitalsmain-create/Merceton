// middleware.ts
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Hostname router + minimal auth gate.
 *
 * - merceton.com           → (landing) segment
 * - app.merceton.com       → (app) segment
 * - admin.merceton.com     → (admin) segment
 *
 * URL paths stay the same:
 * - "/" on merceton.com        -> app/(landing)/page.tsx
 * - "/dashboard" on app.*      -> app/(app)/dashboard/page.tsx
 * - "/admin" on admin.*        -> app/(admin)/admin/page.tsx
 *
 * Edge-safe:
 * - No Prisma, no Node-only libs.
 * - Only uses Supabase SSR with cookies.
 * - Skips /api, /_next, and static assets.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isStaticOrInternal(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/images/")
  )
}

function getHostType(host: string | null): "landing" | "app" | "admin" {
  if (!host) return "landing"
  if (host.startsWith("admin.")) return "admin"
  if (host.startsWith("app.")) return "app"
  return "landing"
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const { pathname } = url
  const host = req.headers.get("host")

  // Skip Next internals, APIs, and static assets
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next()
  }

  const hostType = getHostType(host)

  // Decide route-group prefix based on host
  let prefix: "/(landing)" | "/(app)" | "/(admin)"
  switch (hostType) {
    case "admin":
      prefix = "/(admin)"
      break
    case "app":
      prefix = "/(app)"
      break
    default:
      prefix = "/(landing)"
  }

  // Rewrite into route group while keeping path
  const rewrittenUrl = req.nextUrl.clone()
  rewrittenUrl.pathname = `${prefix}${pathname}`

  let response = NextResponse.rewrite(rewrittenUrl)

  // Protected areas:
  // - app host: /dashboard and related authenticated pages
  // - admin host: /admin and /admin/... routes
  const isAppProtected =
    hostType === "app" && pathname.startsWith("/dashboard")
  const isAdminProtected =
    hostType === "admin" && (pathname === "/" || pathname.startsWith("/admin"))
  const needsAuth = isAppProtected || isAdminProtected

  // If Supabase env vars are missing, skip auth gate (do not throw)
  if (!needsAuth || !supabaseUrl || !supabaseAnonKey) {
    if (
      needsAuth &&
      process.env.NODE_ENV === "development" &&
      (!supabaseUrl || !supabaseAnonKey)
    ) {
      console.warn(
        "[middleware] Supabase env vars missing; auth gate skipped. Route-level guards must handle auth."
      )
    }
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Always use path "/" so sessions are shared correctly
          response.cookies.set({ name, value, ...options, path: "/" })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options, path: "/" })
        },
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error && process.env.NODE_ENV === "development") {
      console.warn("[middleware] Supabase auth.getUser error:", error.message)
    }

    if (!user) {
      // Use appropriate sign-in target
      const redirectPath =
        hostType === "admin" ? "/admin/sign-in" : "/sign-in"
      const redirectUrl = new URL(redirectPath, req.url)
      redirectUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Authenticated; proceed with rewritten response
    return response
  } catch (err) {
    // Never crash middleware; allow request to pass and rely on route-level checks
    if (process.env.NODE_ENV === "development") {
      console.error("[middleware] Unexpected error in middleware, allowing request through:", err)
    }
    return response
  }
}

export const config = {
  matcher: [
    // Apply middleware to all non-static, non-API routes
    "/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|static/|assets/|images/).*)",
  ],
}