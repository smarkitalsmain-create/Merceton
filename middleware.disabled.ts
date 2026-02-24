import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SUPER_ADMIN_EMAILS =
  process.env.SUPER_ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean) ?? []

function createSupabaseClient(req: NextRequest, cookiePath: string = "/") {
  let res = NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options, path: cookiePath })
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...options, path: cookiePath })
      },
    },
  })

  return { supabase, res }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = new URL(req.url)
  const host = req.headers.get("host") || ""

  // Debug logging
  console.log("MW HOST:", host, "PATH:", pathname)

  // Skip rewrites for API routes, Next.js internals, and static assets
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/i)
  ) {
    const response = NextResponse.next()
    response.headers.set("x-merceton-host", host)
    response.headers.set("x-merceton-path", pathname)
    return response
  }

  // Determine prefix based on host
  let prefix = "/_site" // default
  if (host.startsWith("admin.")) {
    prefix = "/_admin"
  } else if (host.startsWith("app.")) {
    prefix = "/_app"
  }

  // If pathname already starts with prefix, no rewrite needed
  let rewritePath = pathname
  if (!pathname.startsWith(prefix)) {
    // Rewrite to prefix + pathname (preserve search params)
    rewritePath = `${prefix}${pathname === "/" ? "" : pathname}`
  }

  // Perform rewrite (preserve search params)
  const rewriteUrl = new URL(rewritePath + search, req.url)
  const rewrite = NextResponse.rewrite(rewriteUrl)
  
  // Add debug headers
  rewrite.headers.set("x-merceton-host", host)
  rewrite.headers.set("x-merceton-path", pathname)
  rewrite.headers.set("x-merceton-rewrite", rewritePath)

  // Route protection (only for app and admin routes after rewrite)
  // Exclude sign-in, sign-up, auth callbacks, and other public routes
  const isPublicRoute =
    rewritePath.startsWith("/_app/sign-in") ||
    rewritePath.startsWith("/_app/sign-up") ||
    rewritePath.startsWith("/_app/forgot-password") ||
    rewritePath.startsWith("/_app/reset-password") ||
    rewritePath.startsWith("/_app/auth/callback") ||
    rewritePath.startsWith("/_admin/sign-in") ||
    rewritePath.startsWith("/_admin/auth/callback")

  if (
    !isPublicRoute &&
    (rewritePath.startsWith("/_app/dashboard") || rewritePath.startsWith("/_admin"))
  ) {
    const cookiePath = rewritePath.startsWith("/_admin") ? "/_admin" : "/_app"
    const { supabase } = createSupabaseClient(req, cookiePath)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Use original pathname for redirect param (not rewritten path)
      const redirectParam = encodeURIComponent(pathname + req.nextUrl.search)
      // Redirect to sign-in using the original URL structure (browser will rewrite again)
      const signInPath = rewritePath.startsWith("/_admin") ? "/sign-in" : "/sign-in"
      return NextResponse.redirect(new URL(`${signInPath}?redirect=${redirectParam}`, req.url))
    }

    // Admin route: enforce SUPER_ADMIN_EMAILS allowlist
    if (rewritePath.startsWith("/_admin")) {
      const email = (user.email ?? "").toLowerCase()
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email)

      if (!isSuperAdmin) {
        // Authenticated but not in super admin allowlist; send to app dashboard
        return NextResponse.redirect(new URL("/_app/dashboard", req.url))
      }
    }
  }

  return rewrite
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)"],
}
