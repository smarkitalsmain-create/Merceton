/**
 * Hold reason codes and labels for merchant account holds
 * Used in admin UI dropdown and email templates
 */

export const HOLD_REASON_CODES = [
  "KYC_MISMATCH",
  "KYC_PENDING_TOO_LONG",
  "SUSPICIOUS_ORDERS",
  "HIGH_RTO",
  "POLICY_VIOLATION",
  "PAYMENT_RISK",
  "DOCUMENTS_REQUIRED",
  "MANUAL_REVIEW",
  "OTHER",
] as const

export type HoldReasonCode = (typeof HOLD_REASON_CODES)[number]

export const HOLD_REASON_LABELS: Record<HoldReasonCode, string> = {
  KYC_MISMATCH: "KYC Information Mismatch",
  KYC_PENDING_TOO_LONG: "KYC Pending Too Long",
  SUSPICIOUS_ORDERS: "Suspicious Order Activity",
  HIGH_RTO: "High Return-to-Origin Rate",
  POLICY_VIOLATION: "Policy Violation",
  PAYMENT_RISK: "Payment Risk Detected",
  DOCUMENTS_REQUIRED: "Additional Documents Required",
  MANUAL_REVIEW: "Manual Review Required",
  OTHER: "Other (specify in notes)",
}

/**
 * Get human-readable label for a hold reason code
 */
export function getHoldReasonLabel(code: HoldReasonCode | string | null | undefined): string {
  if (!code) return "Unknown"
  return HOLD_REASON_LABELS[code as HoldReasonCode] || code
}

/**
 * Check if a reason code requires additional notes
 */
export function requiresNotes(code: HoldReasonCode | string | null | undefined): boolean {
  return code === "OTHER"
}
