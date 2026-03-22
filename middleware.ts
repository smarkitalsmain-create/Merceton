import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

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

type HostType = "landing" | "app" | "admin"

function getHostType(host: string | null): HostType {
  if (!host) return "landing"
  if (host.startsWith("admin.")) return "admin"
  if (host.startsWith("app.")) return "app"
  return "landing"
}

function isLocalDevHost(host: string | null): boolean {
  if (!host) return false
  const h = host.toLowerCase()
  return (
    h.startsWith("localhost") ||
    h.startsWith("127.0.0.1") ||
    h.includes(".localhost")
  )
}

/**
 * On localhost, marketing links use /app/... while real routes are /..., /dashboard, etc.
 * Rewrite /app → /dashboard, /app/sign-in → /sign-in, etc.
 */
function stripLandingAppPrefix(pathname: string): {
  innerPath: string
  rewrite: boolean
} {
  if (pathname === "/app" || pathname === "/app/") {
    return { innerPath: "/dashboard", rewrite: true }
  }
  if (pathname.startsWith("/app/")) {
    const rest = pathname.slice(4)
    const inner = rest.startsWith("/") ? rest : `/${rest}`
    return { innerPath: inner, rewrite: true }
  }
  return { innerPath: pathname, rewrite: false }
}

function resolveEffectiveHostType(
  hostType: HostType,
  host: string | null,
  pathname: string,
  appPrefixRewrite: boolean
): HostType {
  if (!isLocalDevHost(host)) return hostType
  if (appPrefixRewrite) return "app"
  if (pathname.startsWith("/admin")) return "admin"
  return hostType
}

function isPublicAuthPath(pathname: string): boolean {
  if (
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/admin/sign-in"
  ) {
    return true
  }

  if (pathname.startsWith("/auth/")) {
    return true
  }

  return false
}

function rewriteToPath(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.rewrite(url)
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c)
  })
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host")
  const hostType = getHostType(host)
  const local = isLocalDevHost(host)

  let pathname = req.nextUrl.pathname
  let appPrefixRewrite = false

  // Skip Next internals, APIs, and static assets
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next()
  }

  // Local dev: /dashboard on marketing host → canonical /app/dashboard URLs
  if (hostType === "landing" && local && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(
      new URL(`/app${pathname}${req.nextUrl.search}`, req.url)
    )
  }

  // Local dev: map /app/* to real routes (same as cross-origin app.* in prod)
  if (hostType === "landing") {
    const stripped = stripLandingAppPrefix(pathname)
    if (stripped.rewrite) {
      pathname = stripped.innerPath
      appPrefixRewrite = true
    }
  }

  const effectiveHostType = resolveEffectiveHostType(
    hostType,
    host,
    pathname,
    appPrefixRewrite
  )

  // Host-specific root behavior and disallowed paths on landing host (non-local only)
  if (hostType === "landing" && !local) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  } else if (hostType === "app") {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  } else if (hostType === "admin") {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  // Public auth routes (always bypass auth gate to avoid loops)
  if (isPublicAuthPath(pathname)) {
    return appPrefixRewrite ? rewriteToPath(req, pathname) : NextResponse.next()
  }

  // Determine if this route requires auth (subdomain or localhost /app + /admin paths)
  const isAppProtected =
    effectiveHostType === "app" && pathname.startsWith("/dashboard")
  const isAdminProtected =
    effectiveHostType === "admin" &&
    pathname.startsWith("/admin") &&
    pathname !== "/admin/sign-in"

  const needsAuth = isAppProtected || isAdminProtected

  // Guard missing env vars so middleware never throws; allow request through
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
    return appPrefixRewrite ? rewriteToPath(req, pathname) : NextResponse.next()
  }

  const response = NextResponse.next()

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
        effectiveHostType === "admin" ? "/admin/sign-in" : "/sign-in"
      const redirectUrl = new URL(redirectPath, req.url)
      redirectUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (appPrefixRewrite) {
      const rewritten = rewriteToPath(req, pathname)
      copyCookies(response, rewritten)
      return rewritten
    }
    return response
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[middleware] Unexpected error in middleware, allowing request through:",
        err
      )
    }
    if (appPrefixRewrite) {
      const rewritten = rewriteToPath(req, pathname)
      copyCookies(response, rewritten)
      return rewritten
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
