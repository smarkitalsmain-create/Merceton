import type { Metadata } from "next"
import LegalPolicyPage from "@/components/marketing/LegalPolicyPage"

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Merceton Refund and Cancellation Policy",
  robots: { index: true, follow: true },
}

export const dynamic = "force-dynamic"

export default function RefundCancellationPolicyRoute() {
  return <LegalPolicyPage policyKey="refund-cancellation-policy" />
}

