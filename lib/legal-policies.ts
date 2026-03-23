import { readFile } from "node:fs/promises"
import path from "node:path"

export type LegalPolicyKey =
  | "privacy-policy"
  | "refund-cancellation-policy"
  | "shipping-delivery-policy"
  | "terms-and-conditions"
  | "merchant-agreement"

export interface LegalPolicyConfig {
  title: string
  markdownFile: string
  route: `/${LegalPolicyKey}`
}

export const LEGAL_POLICIES: Record<LegalPolicyKey, LegalPolicyConfig> = {
  "privacy-policy": {
    title: "Privacy Policy",
    markdownFile: "PRIVACY POLICY.md",
    route: "/privacy-policy",
  },
  "refund-cancellation-policy": {
    title: "Refund & Cancellation Policy",
    markdownFile: "REFUND & CANCELLATION POLICY.md",
    route: "/refund-cancellation-policy",
  },
  "shipping-delivery-policy": {
    title: "Shipping & Delivery Policy",
    markdownFile: "SHIPPING & DELIVERY POLICY.md",
    route: "/shipping-delivery-policy",
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    markdownFile: "TERMS & CONDITIONS.md",
    route: "/terms-and-conditions",
  },
  "merchant-agreement": {
    title: "Merchant Agreement",
    markdownFile: "MERCHANT AGREEMENT.md",
    route: "/merchant-agreement",
  },
}

export interface LegalPolicyContent {
  title: string
  markdown: string
  lastUpdated?: string
}

export async function getLegalPolicyContent(key: LegalPolicyKey): Promise<LegalPolicyContent> {
  const policy = LEGAL_POLICIES[key]
  const filePath = path.join(process.cwd(), "Policy", policy.markdownFile)
  const markdown = await readFile(filePath, "utf8")

  const lastUpdatedMatch = markdown.match(/Last Updated:\s*(.+)/i)
  const lastUpdated = lastUpdatedMatch?.[1]?.trim()

  return {
    title: policy.title,
    markdown,
    ...(lastUpdated ? { lastUpdated } : {}),
  }
}

