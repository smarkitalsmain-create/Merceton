import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { resolveMerchantFromHost } from "@/lib/domain"

const isPublicRoute = createRouteMatcher([
  "/",
  "/s(.*)",          // public storefront
  "/sign-in(.*)",    // Clerk sign-in page
  "/sign-up(.*)",    // Clerk sign-up page
  "/api/webhooks(.*)" // keep webhooks public if you have them
])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") || ""
  const url = req.nextUrl.clone()

  // Check if this is a custom domain request
  const merchant = await resolveMerchantFromHost(host)

  if (merchant) {
    // Custom domain is active - rewrite to storefront
    // Skip auth for custom domain storefronts
    const pathname = url.pathname
    const search = url.search

    // Don't rewrite Next.js internals or API routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/static")
    ) {
      return NextResponse.next()
    }

    // Rewrite to /s/[slug] with original pathname and search
    // If pathname is already /s/[slug], don't double it
    if (pathname.startsWith(`/s/${merchant.slug}`)) {
      // Already correct path, just pass through
      return NextResponse.next()
    }

    // Rewrite root and other paths to storefront
    url.pathname = `/s/${merchant.slug}${pathname === "/" ? "" : pathname}`
    url.search = search

    return NextResponse.rewrite(url)
  }

  // Platform domain - use normal routing
  // Allow public routes without auth
  if (isPublicRoute(req)) return

  // Protect everything else (including /onboarding and /dashboard)
  // Note: /onboarding requires auth but NOT merchant (handled in page)
  auth().protect()
})

export const config = {
  matcher: [
    // run middleware on all routes except next internals and static files
    "/((?!_next|.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|ttf|woff|woff2)).*)",
    "/(api|trpc)(.*)",
  ],
};
