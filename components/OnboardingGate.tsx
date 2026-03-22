"use client"

import { usePathname, useRouter } from "next/navigation"
import { useLayoutEffect } from "react"
import { Loader2 } from "lucide-react"

interface OnboardingGateProps {
  children: React.ReactNode
  onboardingStatus: string
}

/**
 * Matches both canonical routes and the local-dev `/app/...` URL prefix
 * (see middleware: /app/dashboard/* rewrites to /dashboard/*).
 * usePathname() reflects the browser URL, so it may be `/app/dashboard/onboarding`.
 */
function isOnboardingRoute(pathname: string): boolean {
  if (
    pathname === "/dashboard/onboarding" ||
    pathname.startsWith("/dashboard/onboarding/")
  ) {
    return true
  }
  if (
    pathname === "/dashboard/settings/onboarding" ||
    pathname.startsWith("/dashboard/settings/onboarding/")
  ) {
    return true
  }
  if (
    pathname === "/app/dashboard/onboarding" ||
    pathname.startsWith("/app/dashboard/onboarding/")
  ) {
    return true
  }
  if (
    pathname === "/app/dashboard/settings/onboarding" ||
    pathname.startsWith("/app/dashboard/settings/onboarding/")
  ) {
    return true
  }
  return false
}

/**
 * Redirect target must keep the same `/app` prefix the user sees, or middleware
 * will bounce between `/dashboard/...` and `/app/dashboard/...` (loop).
 */
function getOnboardingHref(currentPathname: string): string {
  if (currentPathname.startsWith("/app/")) {
    return "/app/dashboard/onboarding"
  }
  return "/dashboard/onboarding"
}

/**
 * Redirects merchants with incomplete onboarding away from the main dashboard shell.
 * Shows a loading UI while navigating (never loops while already on onboarding).
 */
export function OnboardingGate({ children, onboardingStatus }: OnboardingGateProps) {
  const pathname = usePathname()
  const router = useRouter()

  const needsRedirect =
    onboardingStatus !== "COMPLETED" && !isOnboardingRoute(pathname)

  useLayoutEffect(() => {
    if (!needsRedirect) return
    router.replace(getOnboardingHref(pathname))
  }, [needsRedirect, router, pathname])

  if (needsRedirect) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Redirecting to onboarding…</p>
      </div>
    )
  }

  return <>{children}</>
}
