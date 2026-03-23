import type { Metadata } from "next"
import LegalPolicyPage from "@/components/marketing/LegalPolicyPage"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Merceton Terms and Conditions",
  robots: { index: true, follow: true },
}

export const dynamic = "force-dynamic"

export default function TermsAndConditionsRoute() {
  return <LegalPolicyPage policyKey="terms-and-conditions" />
}

