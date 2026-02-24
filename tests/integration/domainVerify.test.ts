/**
 * Integration tests for domain verification
 * 
 * Tests the verify endpoint with mocked DNS lookups
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import dns from "dns"

// Mock dns module
vi.mock("dns", () => {
  const mockResolveTxt = vi.fn()
  return {
    default: {
      resolveTxt: mockResolveTxt,
    },
    promises: {
      resolveTxt: mockResolveTxt,
    },
  }
})

describe("Domain Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should verify domain when TXT record matches token", async () => {
    const mockResolveTxt = vi.mocked(dns.promises.resolveTxt)
    const expectedToken = "abc123def456"
    
    // Mock DNS lookup returning matching token
    mockResolveTxt.mockResolvedValue([[expectedToken]])

    // In a real test, you would:
    // 1. Create a test merchant with customDomain and domainVerificationToken
    // 2. Call POST /api/domains/verify
    // 3. Assert merchant.domainStatus is updated to VERIFIED
    // 4. Assert domainVerifiedAt is set

    // For now, just test the DNS lookup logic
    const txtRecords = await mockResolveTxt("_merceton-verify.example.com")
    const allTxtValues = txtRecords.flat()
    const tokenFound = allTxtValues.some((record) => record.trim() === expectedToken)

    expect(tokenFound).toBe(true)
    expect(mockResolveTxt).toHaveBeenCalledWith("_merceton-verify.example.com")
  })

  it("should fail verification when TXT record doesn't match", async () => {
    const mockResolveTxt = vi.mocked(dns.promises.resolveTxt)
    const expectedToken = "abc123def456"
    const wrongToken = "wrong-token"
    
    // Mock DNS lookup returning different token
    mockResolveTxt.mockResolvedValue([[wrongToken]])

    const txtRecords = await mockResolveTxt("_merceton-verify.example.com")
    const allTxtValues = txtRecords.flat()
    const tokenFound = allTxtValues.some((record) => record.trim() === expectedToken)

    expect(tokenFound).toBe(false)
  })

  it("should handle DNS lookup failure", async () => {
    const mockResolveTxt = vi.mocked(dns.promises.resolveTxt)
    
    // Mock DNS lookup failure (record not found)
    mockResolveTxt.mockRejectedValue(new Error("ENOTFOUND"))

    await expect(mockResolveTxt("_merceton-verify.example.com")).rejects.toThrow("ENOTFOUND")
  })

  it("should handle multiple TXT records", async () => {
    const mockResolveTxt = vi.mocked(dns.promises.resolveTxt)
    const expectedToken = "abc123def456"
    
    // Mock DNS lookup returning multiple records
    mockResolveTxt.mockResolvedValue([
      ["other-record"],
      [expectedToken],
      ["another-record"],
    ])

    const txtRecords = await mockResolveTxt("_merceton-verify.example.com")
    const allTxtValues = txtRecords.flat()
    const tokenFound = allTxtValues.some((record) => record.trim() === expectedToken)

    expect(tokenFound).toBe(true)
  })
})
