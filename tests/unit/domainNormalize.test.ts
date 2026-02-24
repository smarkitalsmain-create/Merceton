/**
 * Unit tests for domain normalization
 */

import { describe, it, expect } from "vitest"
import {
  normalizeDomain,
  isValidDomainFormat,
  getVerificationRecordName,
} from "@/lib/domains/normalize"

describe("Domain Normalization", () => {
  describe("normalizeDomain", () => {
    it("should normalize basic domain", () => {
      expect(normalizeDomain("example.com")).toBe("example.com")
    })

    it("should remove protocol", () => {
      expect(normalizeDomain("https://example.com")).toBe("example.com")
      expect(normalizeDomain("http://example.com")).toBe("example.com")
    })

    it("should remove www prefix", () => {
      expect(normalizeDomain("www.example.com")).toBe("example.com")
      expect(normalizeDomain("https://www.example.com")).toBe("example.com")
    })

    it("should remove trailing slash", () => {
      expect(normalizeDomain("example.com/")).toBe("example.com")
    })

    it("should remove path", () => {
      expect(normalizeDomain("example.com/path/to/page")).toBe("example.com")
      expect(normalizeDomain("example.com/path?query=1")).toBe("example.com")
    })

    it("should remove query and fragment", () => {
      expect(normalizeDomain("example.com?query=1")).toBe("example.com")
      expect(normalizeDomain("example.com#fragment")).toBe("example.com")
    })

    it("should convert to lowercase", () => {
      expect(normalizeDomain("EXAMPLE.COM")).toBe("example.com")
      expect(normalizeDomain("Example.Com")).toBe("example.com")
    })

    it("should handle complex cases", () => {
      expect(normalizeDomain("HTTPS://WWW.EXAMPLE.COM/PATH?QUERY=1#FRAGMENT")).toBe("example.com")
    })

    it("should throw for empty string", () => {
      expect(() => normalizeDomain("")).toThrow()
    })

    it("should throw for non-string", () => {
      expect(() => normalizeDomain(null as any)).toThrow()
      expect(() => normalizeDomain(undefined as any)).toThrow()
    })
  })

  describe("isValidDomainFormat", () => {
    it("should validate correct domains", () => {
      expect(isValidDomainFormat("example.com")).toBe(true)
      expect(isValidDomainFormat("subdomain.example.com")).toBe(true)
      expect(isValidDomainFormat("example.co.uk")).toBe(true)
      expect(isValidDomainFormat("my-store.com")).toBe(true)
    })

    it("should reject invalid domains", () => {
      expect(isValidDomainFormat("")).toBe(false)
      expect(isValidDomainFormat("not-a-domain")).toBe(false)
      expect(isValidDomainFormat(".com")).toBe(false)
      expect(isValidDomainFormat("example.")).toBe(false)
    })
  })

  describe("getVerificationRecordName", () => {
    it("should generate correct TXT record name", () => {
      expect(getVerificationRecordName("example.com")).toBe("_merceton-verify.example.com")
      expect(getVerificationRecordName("subdomain.example.com")).toBe("_merceton-verify.subdomain.example.com")
    })
  })
})
