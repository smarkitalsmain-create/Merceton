/**
 * Admin ops overview: merchants on hold, KYC pending, domains, payouts.
 * Uses Prisma aggregates only. Returns 0 for missing models/fields; optional warnings.
 */

import { prisma } from "@/lib/prisma"

export interface OpsOverviewResult {
  merchantsOnHold: number
  kycPending: number
  domainsPending: number
  payoutsAwaitingApproval: number
  payoutsPendingExecution: number
  warnings?: string[]
}

export async function getOpsOverview(): Promise<OpsOverviewResult> {
  const warnings: string[] = []

  let merchantsOnHold = 0
  let kycPending = 0
  let domainsPending = 0
  try {
    const [hold, kyc, domains] = await Promise.all([
      prisma.merchant.count({
        where: { accountStatus: "ON_HOLD" },
      }),
      prisma.merchant.count({
        where: { kycStatus: { in: ["PENDING", "SUBMITTED"] } },
      }),
      prisma.merchant.count({
        where: { domainStatus: "PENDING" },
      }),
    ])
    merchantsOnHold = hold
    kycPending = kyc
    domainsPending = domains
  } catch (e) {
    warnings.push("Merchant counts failed")
  }

  let payoutsAwaitingApproval = 0
  let payoutsPendingExecution = 0
  try {
    const [pending, processing] = await Promise.all([
      prisma.payoutBatch.count({ where: { status: "PENDING" } }),
      prisma.payoutBatch.count({ where: { status: "PROCESSING" } }),
    ])
    payoutsAwaitingApproval = pending
    payoutsPendingExecution = processing
  } catch (e) {
    warnings.push("PayoutBatch counts failed")
  }

  return {
    merchantsOnHold,
    kycPending,
    domainsPending,
    payoutsAwaitingApproval,
    payoutsPendingExecution,
    ...(warnings.length > 0 ? { warnings } : {}),
  }
}
