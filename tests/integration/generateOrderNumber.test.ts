import { describe, it, expect } from "vitest"
import { prisma } from "@/lib/prisma"
import { generateOrderNumber } from "@/lib/order/generateOrderNumber"

describe("generateOrderNumber", () => {
  it("generates incrementing order numbers with correct format", async () => {
    const n1 = await generateOrderNumber(prisma)
    const n2 = await generateOrderNumber(prisma)

    expect(n1).toMatch(/^ORD-\d{4}-\d{6}$/)
    expect(n2).toMatch(/^ORD-\d{4}-\d{6}$/)
    expect(n1).not.toBe(n2)
  })
})

