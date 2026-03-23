import type { Metadata } from "next"
import LegalPolicyPage from "@/components/marketing/LegalPolicyPage"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Merceton Privacy Policy",
  robots: { index: true, follow: true },
}

export const dynamic = "force-dynamic"

export default function PrivacyPolicyRoute() {
  return <LegalPolicyPage policyKey="privacy-policy" />
}

