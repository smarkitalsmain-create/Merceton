/**
 * Unit tests for PAN validation rules
 */

import { describe, it, expect } from "vitest"
import {
  getExpectedPan4thChar,
  validatePan4thChar,
  getPanTypeMismatchMessage,
  validateGstContainsPan,
  getGstPanMismatchMessage,
  type PanType,
} from "@/lib/validation/panRules"

describe("PAN Rules", () => {
  describe("getExpectedPan4thChar", () => {
    it("should return correct 4th character for each PAN type", () => {
      expect(getExpectedPan4thChar("INDIVIDUAL")).toBe("P")
      expect(getExpectedPan4thChar("COMPANY")).toBe("C")
      expect(getExpectedPan4thChar("PARTNERSHIP")).toBe("F")
      expect(getExpectedPan4thChar("LLP")).toBe("F")
      expect(getExpectedPan4thChar("HUF")).toBe("H")
      expect(getExpectedPan4thChar("TRUST")).toBe("T")
      expect(getExpectedPan4thChar("AOP")).toBe("A")
      expect(getExpectedPan4thChar("BOI")).toBe("A")
    })
  })

  describe("validatePan4thChar", () => {
    it("should validate Individual PAN (4th char = P)", () => {
      expect(validatePan4thChar("ABCDP1234E", "INDIVIDUAL")).toBe(true)
      expect(validatePan4thChar("ABCDC1234E", "INDIVIDUAL")).toBe(false)
    })

    it("should validate Company PAN (4th char = C)", () => {
      expect(validatePan4thChar("ABCDC1234E", "COMPANY")).toBe(true)
      expect(validatePan4thChar("ABCDP1234E", "COMPANY")).toBe(false)
    })

    it("should validate Partnership PAN (4th char = F)", () => {
      expect(validatePan4thChar("ABCDF1234E", "PARTNERSHIP")).toBe(true)
      expect(validatePan4thChar("ABCDC1234E", "PARTNERSHIP")).toBe(false)
    })

    it("should validate LLP PAN (4th char = F)", () => {
      expect(validatePan4thChar("ABCDF1234E", "LLP")).toBe(true)
      expect(validatePan4thChar("ABCDC1234E", "LLP")).toBe(false)
    })

    it("should validate HUF PAN (4th char = H)", () => {
      expect(validatePan4thChar("ABCDH1234E", "HUF")).toBe(true)
      expect(validatePan4thChar("ABCDP1234E", "HUF")).toBe(false)
    })

    it("should validate Trust PAN (4th char = T)", () => {
      expect(validatePan4thChar("ABCDT1234E", "TRUST")).toBe(true)
      expect(validatePan4thChar("ABCDP1234E", "TRUST")).toBe(false)
    })

    it("should validate AOP PAN (4th char = A)", () => {
      expect(validatePan4thChar("ABCDA1234E", "AOP")).toBe(true)
      expect(validatePan4thChar("ABCDP1234E", "AOP")).toBe(false)
    })

    it("should validate BOI PAN (4th char = A)", () => {
      expect(validatePan4thChar("ABCDA1234E", "BOI")).toBe(true)
      expect(validatePan4thChar("ABCDP1234E", "BOI")).toBe(false)
    })

    it("should return false for PAN with less than 4 characters", () => {
      expect(validatePan4thChar("ABC", "INDIVIDUAL")).toBe(false)
    })
  })

  describe("getPanTypeMismatchMessage", () => {
    it("should generate correct error message", () => {
      const message = getPanTypeMismatchMessage("ABCDC1234E", "INDIVIDUAL")
      expect(message).toContain("PAN type mismatch")
      expect(message).toContain("Individual")
      expect(message).toContain("P")
      expect(message).toContain("C")
    })
  })

  describe("validateGstContainsPan", () => {
    it("should validate GST contains PAN (characters 3-12)", () => {
      const pan = "ABCDE1234F"
      const gstin = "27ABCDE1234F1Z5" // State code 27 + PAN + entity + Z + check digit
      expect(validateGstContainsPan(gstin, pan)).toBe(true)
    })

    it("should reject GST that doesn't contain PAN", () => {
      const pan = "ABCDE1234F"
      const gstin = "27XYZDE1234F1Z5" // Different PAN
      expect(validateGstContainsPan(gstin, pan)).toBe(false)
    })

    it("should return false for invalid lengths", () => {
      expect(validateGstContainsPan("27ABCDE1234F", "ABCDE1234F")).toBe(false) // GST too short
      expect(validateGstContainsPan("27ABCDE1234F1Z5", "ABCDE123")).toBe(false) // PAN too short
    })
  })

  describe("getGstPanMismatchMessage", () => {
    it("should return correct error message", () => {
      const message = getGstPanMismatchMessage()
      expect(message).toContain("GST does not match PAN")
      expect(message).toContain("characters 3–12")
    })
  })
})
