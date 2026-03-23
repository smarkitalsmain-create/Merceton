import type { Metadata } from "next"
import LegalPolicyPage from "@/components/marketing/LegalPolicyPage"

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "Merceton Shipping and Delivery Policy",
  robots: { index: true, follow: true },
}

export const dynamic = "force-dynamic"

export default function ShippingDeliveryPolicyRoute() {
  return <LegalPolicyPage policyKey="shipping-delivery-policy" />
}

