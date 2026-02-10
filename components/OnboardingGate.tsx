"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

interface OnboardingGateProps {
  children: React.ReactNode
  onboardingStatus: string
}

/**
 * Client component that checks onboarding status and redirects if needed.
 * This allows us to check pathname (which is only available client-side)
 * without calling cookies() or Prisma in middleware.
 */
export function OnboardingGate({ children, onboardingStatus }: OnboardingGateProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // If onboarding is not completed and we're NOT on the onboarding page, redirect
    if (onboardingStatus !== "COMPLETED" && pathname !== "/dashboard/onboarding") {
      router.replace("/dashboard/onboarding")
    }
  }, [onboardingStatus, pathname, router])

  // If onboarding is incomplete and we're not on onboarding page, don't render children
  // (redirect will happen via useEffect)
  if (onboardingStatus !== "COMPLETED" && pathname !== "/dashboard/onboarding") {
    return null
  }

  return <>{children}</>
}
