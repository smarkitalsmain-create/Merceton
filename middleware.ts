import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isBypassed(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/static/")
  )
}

type HostType = "landing" | "app" | "admin"

function getHostType(host: string | null): HostType {
  const h = (host || "").toLowerCase()

  // local dev convenience
  // - merceton.localhost:3000 -> landing
  // - app.localhost:3000 -> app
  // - admin.localhost:3000 -> admin
  if (h.startsWith("admin.")) return "admin"
  if (h.startsWith("app.")) return "app"
  return "landing"
}

function rewriteToGroup(req: NextRequest, group: HostType) {
  const url = req.nextUrl.clone()
  const prefix = group === "admin" ? "/(admin)" : group === "app" ? "/(app)" : "/(landing)"
  url.pathname = `${prefix}${url.pathname}`
  return NextResponse.rewrite(url)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hostType = getHostType(req.headers.get("host"))

  if (isBypassed(pathname)) return NextResponse.next()

  // Prevent direct access to wrong areas by host
  // Root domain is LANDING only
  if (hostType === "landing") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Optional: force home redirect per subdomain (nice UX)
  if (hostType === "app" && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
  if (hostType === "admin" && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  // Decide if auth is required (tune these)
  const needsAuth =
    (hostType === "app" && pathname.startsWith("/dashboard")) ||
    (hostType === "admin" && pathname.startsWith("/admin"))

  // Always rewrite to correct route group (this is the key part)
  let response = rewriteToGroup(req, hostType)

  // If auth not required, done
  if (!needsAuth) return response

  // Never crash middleware if env is missing
  if (!supabaseUrl || !supabaseAnonKey) return response

  // Supabase session refresh + user check (edge-safe)
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

  const { data } = await supabase.auth.getUser()

  if (!data?.user) {
    const redirectPath = hostType === "admin" ? "/admin/sign-in" : "/sign-in"
    const redirectUrl = new URL(redirectPath, req.url)
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|assets/|images/|static/).*)",
  ],
}