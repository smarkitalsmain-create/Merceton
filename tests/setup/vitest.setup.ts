import { afterAll, beforeAll, vi } from "vitest"
import { prisma } from "@/lib/prisma"

// Never send real emails in tests
vi.mock("@/lib/email/sendEmail", () => {
  return {
    sendEmail: vi.fn(async () => {
      return { id: "test-email-id" }
    }),
  }
})

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

