import { describe, it, expect, vi } from "vitest"

// Mock Resend FIRST to prevent client initialization at module load time
// This must be hoisted before any imports that use Resend
vi.mock("resend", () => {
  return {
    Resend: vi.fn(() => ({
      emails: {
        send: vi.fn(async () => ({ id: "test-email-id", error: null })),
      },
    })),
  }
})

// Mock the mailer module to prevent Resend initialization
// This mock must be hoisted before notifications.ts imports mailer.ts
const mockSendEmail = vi.fn().mockResolvedValue({ id: "test-email-id", error: null })

vi.mock("@/lib/email/mailer", () => {
  return {
    sendEmail: mockSendEmail,
  }
})

describe("email notifications", () => {
  it("calls underlying sendEmail for order confirmation with correct payload", async () => {
    // Import after mocks are set up (mocks are hoisted, but explicit import ensures clarity)
    const { sendOrderConfirmationEmail } = await import("@/lib/email/notifications")

    await sendOrderConfirmationEmail({
      to: "customer@example.com",
      customerName: "Test Customer",
      orderId: "order-1",
      orderNumber: "ORD-TEST-000001",
      totalAmount: 1000,
      currency: "INR",
      storeName: "Test Store",
    })

    // Assert sendEmail was called exactly once
    expect(mockSendEmail).toHaveBeenCalledTimes(1)

    // Assert the call payload contains expected fields
    const callArgs = mockSendEmail.mock.calls[0][0]
    expect(callArgs.to).toBe("customer@example.com")
    expect(callArgs.subject).toContain("ORD-TEST-000001")
    expect(callArgs.channel).toBe("orders")
    expect(callArgs.html).toBeTruthy()
    expect(callArgs.tags).toEqual(
      expect.arrayContaining([
        { name: "type", value: "order_confirmation" },
        { name: "order_id", value: "order-1" },
      ])
    )
  })
})

