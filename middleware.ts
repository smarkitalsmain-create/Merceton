// middleware.ts
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Edge-safe middleware for Supabase session refresh + minimal auth gate.
 *
 * - No Prisma or other Node-only imports.
 * - Only checks Supabase session via cookies.
 * - Protects:
 *   - app host: /dashboard (merchant SaaS)
 *   - admin host: /admin (super admin console)
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

function getHostType(host: string | null): "app" | "admin" | "other" {
  if (!host) return "other"
  if (host.startsWith("admin.")) return "admin"
  if (host.startsWith("app.")) return "app"
  return "other"
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get("host")
  const hostType = getHostType(host)

  // Skip Next internals, APIs, and static assets
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next()
  }

  // Determine if this route requires auth
  const isAppProtected =
    hostType === "app" && pathname.startsWith("/dashboard")
  const isAdminProtected =
    hostType === "admin" && (pathname === "/" || pathname.startsWith("/admin"))
  const needsAuth = isAppProtected || isAdminProtected

  // If no Supabase env, skip auth gate (never throw in middleware)
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
    return NextResponse.next()
  }

  let response = NextResponse.next()

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
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
      const redirectPath =
        hostType === "admin" ? "/admin/sign-in" : "/sign-in"
      const redirectUrl = new URL(redirectPath, req.url)
      redirectUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // User is authenticated; refresh cookies and allow request
    return response
  } catch (err) {
    // Never crash middleware; in case of error, allow request to continue
    if (process.env.NODE_ENV === "development") {
      console.error("[middleware] Unexpected error, allowing request through:", err)
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