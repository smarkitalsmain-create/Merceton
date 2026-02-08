/**
 * Platform Fee Calculation Tests
 * 
 * Tests edge cases for fee calculation:
 * - Percentage only
 * - Flat fee only
 * - Percentage + flat fee
 * - Maximum cap
 * - Fee exceeds gross amount
 * - Zero amount
 * - Very large amounts
 */

import { calculatePlatformFee, calculateNetPayable } from "@/lib/fees"

describe("Platform Fee Calculation", () => {
  describe("Default Configuration (2% + ₹5, max ₹25)", () => {
    it("should calculate fee for small order", () => {
      // ₹100 order: 2% = ₹2, + ₹5 = ₹7, no cap
      const fee = calculatePlatformFee(10000) // 10000 paise = ₹100
      expect(fee).toBe(700) // ₹7 in paise
    })

    it("should calculate fee for medium order", () => {
      // ₹500 order: 2% = ₹10, + ₹5 = ₹15, no cap
      const fee = calculatePlatformFee(50000) // 50000 paise = ₹500
      expect(fee).toBe(1500) // ₹15 in paise
    })

    it("should apply maximum cap", () => {
      // ₹2000 order: 2% = ₹40, + ₹5 = ₹45, but cap at ₹25
      const fee = calculatePlatformFee(200000) // 200000 paise = ₹2000
      expect(fee).toBe(2500) // ₹25 in paise (capped)
    })

    it("should handle zero amount", () => {
      const fee = calculatePlatformFee(0)
      expect(fee).toBe(0)
    })

    it("should not exceed gross amount", () => {
      // Very small order: ₹1 = 100 paise
      // 2% = 2 paise, + ₹5 = 502 paise, but should cap at 100 paise
      const fee = calculatePlatformFee(100) // ₹1
      expect(fee).toBe(100) // Should not exceed gross
    })
  })

  describe("Custom Configuration", () => {
    it("should calculate with percentage only", () => {
      const fee = calculatePlatformFee(10000, {
        percentageBps: 300, // 3%
        flatPaise: null,
        maxCapPaise: null,
      })
      expect(fee).toBe(300) // 3% of ₹100 = ₹3
    })

    it("should calculate with flat fee only", () => {
      const fee = calculatePlatformFee(10000, {
        percentageBps: null,
        flatPaise: 1000, // ₹10
        maxCapPaise: null,
      })
      expect(fee).toBe(1000) // ₹10
    })

    it("should calculate with custom percentage + flat", () => {
      const fee = calculatePlatformFee(100000, {
        percentageBps: 150, // 1.5%
        flatPaise: 2000, // ₹20
        maxCapPaise: null,
      })
      // 1.5% of ₹1000 = ₹15, + ₹20 = ₹35
      expect(fee).toBe(3500) // ₹35
    })

    it("should apply custom maximum cap", () => {
      const fee = calculatePlatformFee(100000, {
        percentageBps: 500, // 5%
        flatPaise: 1000, // ₹10
        maxCapPaise: 3000, // ₹30 cap
      })
      // 5% of ₹1000 = ₹50, + ₹10 = ₹60, but cap at ₹30
      expect(fee).toBe(3000) // ₹30
    })

    it("should handle null values (use defaults)", () => {
      const fee = calculatePlatformFee(10000, {
        percentageBps: null,
        flatPaise: null,
        maxCapPaise: null,
      })
      // Should use defaults: 2% + ₹5 = ₹7
      expect(fee).toBe(700)
    })
  })

  describe("Edge Cases", () => {
    it("should handle very large amounts", () => {
      const fee = calculatePlatformFee(10000000) // ₹100,000
      // 2% = ₹2000, + ₹5 = ₹2005, but cap at ₹25
      expect(fee).toBe(2500) // ₹25 (capped)
    })

    it("should handle negative amounts (return 0)", () => {
      const fee = calculatePlatformFee(-1000)
      expect(fee).toBe(0)
    })

    it("should handle fractional paise correctly", () => {
      // ₹100.50 = 10050 paise
      // 2% = 201 paise, + 500 paise = 701 paise
      const fee = calculatePlatformFee(10050)
      expect(fee).toBe(701)
    })
  })

  describe("Net Payable Calculation", () => {
    it("should calculate net payable correctly", () => {
      const gross = 10000 // ₹100
      const fee = calculatePlatformFee(gross)
      const net = calculateNetPayable(gross)
      
      expect(net).toBe(gross - fee)
      expect(net).toBe(9300) // ₹100 - ₹7 = ₹93
    })

    it("should handle zero fee", () => {
      const gross = 10000
      const net = calculateNetPayable(gross, {
        percentageBps: 0,
        flatPaise: 0,
        maxCapPaise: null,
      })
      expect(net).toBe(gross)
    })

    it("should never return negative net", () => {
      const gross = 100 // ₹1
      const net = calculateNetPayable(gross)
      expect(net).toBeGreaterThanOrEqual(0)
    })
  })
})
