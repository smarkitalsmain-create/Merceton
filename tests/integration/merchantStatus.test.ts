/**
 * Integration tests for merchant status transitions
 * 
 * Tests:
 * - Status update writes history
 * - Email notifications are triggered (mocked)
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { PrismaClient } from "@prisma/client"
import { updateMerchantStatus } from "@/app/actions/merchant-status"
import {
  sendMerchantOnHoldEmail,
  sendMerchantKycApprovedEmail,
  sendMerchantHoldReleasedEmail,
} from "@/lib/email/notifications"

// Mock email functions
vi.mock("@/lib/email/notifications", () => ({
  sendMerchantOnHoldEmail: vi.fn().mockResolvedValue({ success: true }),
  sendMerchantKycApprovedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendMerchantHoldReleasedEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock admin auth
vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    userId: "admin-user-id",
    email: "admin@test.com",
  }),
  getAdminIdentity: vi.fn().mockResolvedValue({
    userId: "admin-user-id",
    email: "admin@test.com",
  }),
}))

// Mock audit logging
vi.mock("@/lib/admin/audit", () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}))

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Merchant Status Transitions", () => {
  let prisma: PrismaClient
  let testMerchantId: string

  beforeEach(async () => {
    prisma = new PrismaClient()
    
    // Create a test merchant
    const merchant = await prisma.merchant.create({
      data: {
        slug: `test-merchant-${Date.now()}`,
        displayName: "Test Merchant",
        users: {
          create: {
            authUserId: "test-user-id",
            email: "merchant@test.com",
            role: "ADMIN",
          },
        },
      },
    })
    testMerchantId = merchant.id

    // Clear mocks
    vi.clearAllMocks()
  })

  it("should write status history when updating account status", async () => {
    const result = await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ON_HOLD",
      holdReasonCode: "MANUAL_REVIEW",
      holdReasonText: "Test hold reason",
      reason: "Test audit reason",
    })

    expect(result.success).toBe(true)

    // Check history was created
    const history = await prisma.merchantStatusHistory.findFirst({
      where: { merchantId: testMerchantId },
      orderBy: { createdAt: "desc" },
    })

    expect(history).toBeDefined()
    expect(history?.fromAccountStatus).toBe("ACTIVE")
    expect(history?.toAccountStatus).toBe("ON_HOLD")
    expect(history?.reason).toBe("MANUAL_REVIEW")
    expect(history?.changedByAdminUserId).toBe("admin-user-id")
  })

  it("should send on-hold email when status changes to ON_HOLD", async () => {
    await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ON_HOLD",
      holdReasonCode: "MANUAL_REVIEW",
      holdReasonText: "Test hold reason",
      reason: "Test audit reason",
    })

    // Wait a bit for async email sending
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sendMerchantOnHoldEmail).toHaveBeenCalledWith({
      to: "merchant@test.com",
      merchantName: "Test Merchant",
      reasonCode: "MANUAL_REVIEW",
      reasonText: "Test hold reason",
    })
  })

  it("should send KYC approved email when KYC status changes to APPROVED", async () => {
    await updateMerchantStatus({
      merchantId: testMerchantId,
      kycStatus: "APPROVED",
      reason: "Test audit reason",
    })

    // Wait a bit for async email sending
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sendMerchantKycApprovedEmail).toHaveBeenCalledWith({
      to: "merchant@test.com",
      merchantName: "Test Merchant",
    })
  })

  it("should send hold released email when status changes from ON_HOLD to ACTIVE", async () => {
    // First set to ON_HOLD
    await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ON_HOLD",
      holdReasonCode: "MANUAL_REVIEW",
      reason: "Test audit reason",
    })

    // Clear mocks
    vi.clearAllMocks()

    // Then release hold
    await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ACTIVE",
      reason: "Test audit reason",
    })

    // Wait a bit for async email sending
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sendMerchantHoldReleasedEmail).toHaveBeenCalledWith({
      to: "merchant@test.com",
      merchantName: "Test Merchant",
    })
  })

  it("should update merchant account status in database", async () => {
    await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ON_HOLD",
      holdReasonCode: "MANUAL_REVIEW",
      holdReasonText: "Test hold reason",
      reason: "Test audit reason",
    })

    const merchant = await prisma.merchant.findUnique({
      where: { id: testMerchantId },
    })

    expect(merchant?.accountStatus).toBe("ON_HOLD")
    expect(merchant?.holdReasonCode).toBe("MANUAL_REVIEW")
    expect(merchant?.holdReasonText).toBe("Test hold reason")
    expect(merchant?.holdAppliedAt).toBeDefined()
    expect(merchant?.holdAppliedByUserId).toBe("admin-user-id")
  })

  it("should clear hold fields when releasing hold", async () => {
    // First set to ON_HOLD
    await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ON_HOLD",
      holdReasonCode: "MANUAL_REVIEW",
      reason: "Test audit reason",
    })

    // Then release hold
    await updateMerchantStatus({
      merchantId: testMerchantId,
      accountStatus: "ACTIVE",
      reason: "Test audit reason",
    })

    const merchant = await prisma.merchant.findUnique({
      where: { id: testMerchantId },
    })

    expect(merchant?.accountStatus).toBe("ACTIVE")
    expect(merchant?.holdReasonCode).toBeNull()
    expect(merchant?.holdReasonText).toBeNull()
    expect(merchant?.holdReleasedAt).toBeDefined()
    expect(merchant?.holdReleasedByUserId).toBe("admin-user-id")
  })

  it("should update KYC status and set approval timestamp", async () => {
    await updateMerchantStatus({
      merchantId: testMerchantId,
      kycStatus: "APPROVED",
      reason: "Test audit reason",
    })

    const merchant = await prisma.merchant.findUnique({
      where: { id: testMerchantId },
    })

    expect(merchant?.kycStatus).toBe("APPROVED")
    expect(merchant?.kycApprovedAt).toBeDefined()
    expect(merchant?.kycApprovedByUserId).toBe("admin-user-id")
  })
})
