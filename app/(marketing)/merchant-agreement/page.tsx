import type { Metadata } from "next"
import LegalPolicyPage from "@/components/marketing/LegalPolicyPage"

export const metadata: Metadata = {
  title: "Merchant Agreement",
  description: "Merceton Merchant Agreement",
  robots: { index: true, follow: true },
}

export const dynamic = "force-dynamic"

export default function MerchantAgreementRoute() {
  return <LegalPolicyPage policyKey="merchant-agreement" />
}

