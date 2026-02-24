import { describe, it, expect } from "vitest"
import { prisma } from "@/lib/prisma"
import { allocatePlatformInvoiceNumber } from "@/lib/billing/allocatePlatformInvoiceNumber"

describe("allocatePlatformInvoiceNumber", () => {
  it("allocates unique, incrementing invoice numbers and ensures profile exists", async () => {
    const r1 = await allocatePlatformInvoiceNumber()
    const r2 = await allocatePlatformInvoiceNumber()

    expect(r1.invoiceNumber).toBeTruthy()
    expect(r2.invoiceNumber).toBeTruthy()
    expect(r1.invoiceNumber).not.toBe(r2.invoiceNumber)

    const profile = await prisma.platformBillingProfile.findUnique({
      where: { id: "platform" },
    })

    expect(profile).not.toBeNull()
  })
})

