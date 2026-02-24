diff --git a/middleware.ts b/middleware.ts
--- a/middleware.ts
+++ b/middleware.ts
@@ -1,151 +1,116 @@
-import type { NextRequest } from "next/server"
-import { NextResponse } from "next/server"
-import { createServerClient } from "@supabase/ssr"
-
-const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
-const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
-
-function isStaticOrInternal(pathname: string) {
-  return (
-    pathname.startsWith("/_next/") ||
-    pathname.startsWith("/api/") ||
-    pathname === "/favicon.ico" ||
-    pathname === "/robots.txt" ||
-    pathname === "/sitemap.xml" ||
-    pathname.startsWith("/static/") ||
-    pathname.startsWith("/assets/") ||
-    pathname.startsWith("/images/")
-  )
-}
-
-function getHostType(host: string | null): "app" | "admin" | "other" {
-  if (!host) return "other"
-  if (host.startsWith("admin.")) return "admin"
-  if (host.startsWith("app.")) return "app"
-  return "other"
-}
-
-export async function middleware(req: NextRequest) {
-  const { pathname } = req.nextUrl
-  const host = req.headers.get("host")
-  const hostType = getHostType(host)
-
-  // Skip Next internals, APIs, and static assets
-  if (isStaticOrInternal(pathname)) {
-    return NextResponse.next()
-  }
-
-  // Determine if this route requires auth
-  const isAppProtected =
-    hostType === "app" && pathname.startsWith("/dashboard")
-  const isAdminProtected =
-    hostType === "admin" && (pathname === "/" || pathname.startsWith("/admin"))
-  const needsAuth = isAppProtected || isAdminProtected
-
-  // If no Supabase env, skip auth gate (never throw in middleware)
-  if (!needsAuth || !supabaseUrl || !supabaseAnonKey) {
-    if (
-      needsAuth &&
-      process.env.NODE_ENV === "development" &&
-      (!supabaseUrl || !supabaseAnonKey)
-    ) {
-      console.warn(
-        "[middleware] Supabase env vars missing; auth gate skipped. Route-level guards must handle auth."
-      )
-    }
-    return NextResponse.next()
-  }
-
-  let response = NextResponse.next()
-
-  try {
-    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
-      cookies: {
-        get(name: string) {
-          return req.cookies.get(name)?.value
-        },
-        set(name: string, value: string, options: any) {
-          response.cookies.set({ name, value, ...options, path: "/" })
-        },
-        remove(name: string, options: any) {
-          response.cookies.set({ name, value: "", ...options, path: "/" })
-        },
-      },
-    })
-
-    const {
-      data: { user },
-      error,
-    } = await supabase.auth.getUser()
-
-    if (error && process.env.NODE_ENV === "development") {
-      console.warn("[middleware] Supabase auth.getUser error:", error.message)
-    }
-
-    if (!user) {
-      const redirectPath =
-        hostType === "admin" ? "/admin/sign-in" : "/sign-in"
-      const redirectUrl = new URL(redirectPath, req.url)
-      redirectUrl.searchParams.set("next", pathname)
-      return NextResponse.redirect(redirectUrl)
-    }
-
-    // User is authenticated; refresh cookies and allow request
-    return response
-  } catch (err) {
-    // Never crash middleware; in case of error, allow request to continue
-    if (process.env.NODE_ENV === "development") {
-      console.error("[middleware] Unexpected error, allowing request through:", err)
-    }
-    return response
-  }
-}
-
-export const config = {
-  matcher: [
-    // Apply middleware to all non-static, non-API routes
-    "/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|static/|assets/|images/).*)",
-  ],
-}
+import type { NextRequest } from "next/server"
+import { NextResponse } from "next/server"
+import { createServerClient } from "@supabase/ssr"
+
+/**
+ * Edge-safe middleware:
+ * - No Prisma or Node-only imports
+ * - Host routing + minimal Supabase auth gate
+ *
+ * Host behavior:
+ * - merceton.com           → landing (public)
+ * - app.merceton.com       → merchant SaaS (/dashboard protected)
+ * - admin.merceton.com     → super admin (/admin protected)
+ */
+
+const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
+const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
+
+function isStaticOrInternal(pathname: string) {
+  return (
+    pathname.startsWith("/_next/") ||
+    pathname.startsWith("/api/") ||
+    pathname === "/favicon.ico" ||
+    pathname === "/robots.txt" ||
+    pathname === "/sitemap.xml" ||
+    pathname.startsWith("/static/") ||
+    pathname.startsWith("/assets/") ||
+    pathname.startsWith("/images/")
+  )
+}
+
+function getHostType(host: string | null): "landing" | "app" | "admin" {
+  if (!host) return "landing"
+  if (host.startsWith("admin.")) return "admin"
+  if (host.startsWith("app.")) return "app"
+  return "landing"
+}
+
+function isPublicAuthPath(pathname: string): boolean {
+  if (
+    pathname === "/sign-in" ||
+    pathname === "/sign-up" ||
+    pathname === "/forgot-password" ||
+    pathname === "/reset-password" ||
+    pathname === "/admin/sign-in"
+  ) {
+    return true
+  }
+  // Any auth callback routes should be public as well
+  if (pathname.startsWith("/auth/")) {
+    return true
+  }
+  return false
+}
+
+export async function middleware(req: NextRequest) {
+  const { pathname } = req.nextUrl
+  const host = req.headers.get("host")
+  const hostType = getHostType(host)
+
+  // Skip Next internals, APIs, and static assets
+  if (isStaticOrInternal(pathname)) {
+    return NextResponse.next()
+  }
+
+  // Root path behavior by host
+  if (hostType === "landing") {
+    // On root domain, never allow /admin or /dashboard
+    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
+      return NextResponse.redirect(new URL("/", req.url))
+    }
+  } else if (hostType === "app") {
+    if (pathname === "/") {
+      return NextResponse.redirect(new URL("/dashboard", req.url))
+    }
+  } else if (hostType === "admin") {
+    if (pathname === "/") {
+      return NextResponse.redirect(new URL("/admin", req.url))
+    }
+  }
+
+  // Always allow public auth routes (no auth gate) to avoid loops
+  if (isPublicAuthPath(pathname)) {
+    return NextResponse.next()
+  }
+
+  // Determine if this route requires auth
+  const isAppProtected =
+    hostType === "app" && pathname.startsWith("/dashboard")
+  const isAdminProtected =
+    hostType === "admin" &&
+    pathname.startsWith("/admin") &&
+    pathname !== "/admin/sign-in"
+
+  const needsAuth = isAppProtected || isAdminProtected
+
+  // If env vars missing, never crash – just allow request through
+  if (!needsAuth || !supabaseUrl || !supabaseAnonKey) {
+    if (
+      needsAuth &&
+      process.env.NODE_ENV === "development" &&
+      (!supabaseUrl || !supabaseAnonKey)
+    ) {
+      console.warn(
+        "[middleware] Supabase env vars missing; auth gate skipped. Route-level guards must handle auth."
+      )
+    }
+    return NextResponse.next()
+  }
+
+  let response = NextResponse.next()
+
+  try {
+    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
+      cookies: {
+        get(name: string) {
+          return req.cookies.get(name)?.value
+        },
+        set(name: string, value: string, options: any) {
+          response.cookies.set({ name, value, ...options, path: "/" })
+        },
+        remove(name: string, options: any) {
+          response.cookies.set({ name, value: "", ...options, path: "/" })
+        },
+      },
+    })
+
+    const {
+      data: { user },
+      error,
+    } = await supabase.auth.getUser()
+
+    if (error && process.env.NODE_ENV === "development") {
+      console.warn("[middleware] Supabase auth.getUser error:", error.message)
+    }
+
+    if (!user) {
+      const redirectPath =
+        hostType === "admin" ? "/admin/sign-in" : "/sign-in"
+      const redirectUrl = new URL(redirectPath, req.url)
+      redirectUrl.searchParams.set("next", pathname)
+      return NextResponse.redirect(redirectUrl)
+    }
+
+    // Authenticated; continue
+    return response
+  } catch (err) {
+    if (process.env.NODE_ENV === "development") {
+      console.error("[middleware] Unexpected error in middleware, allowing request through:", err)
+    }
+    return response
+  }
+}
+
+export const config = {
+  matcher: [
+    // Apply middleware to all non-static, non-API routes
+    "/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml|static/|assets/|images/).*)",
+  ],
+}