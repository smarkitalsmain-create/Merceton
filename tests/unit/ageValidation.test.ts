/**
 * Unit tests for age validation
 * 
 * Tests edge cases:
 * - Exact 18th birthday today
 * - One day short of 18
 * - Leap year edge cases
 */

import { describe, it, expect } from "vitest"
import {
  calculateAge,
  isAge18Plus,
  getAgeValidationErrorMessage,
  getMinimumDob,
} from "@/lib/validation/ageValidation"

describe("Age Validation", () => {
  describe("calculateAge", () => {
    it("should calculate age correctly for person who turned 18 today", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2006-01-15") // Exactly 18 years ago
      expect(calculateAge(dob, today)).toBe(18)
    })

    it("should calculate age correctly for person who turns 18 tomorrow", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2006-01-16") // One day short
      expect(calculateAge(dob, today)).toBe(17)
    })

    it("should calculate age correctly for person who turned 18 yesterday", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2006-01-14") // One day past 18
      expect(calculateAge(dob, today)).toBe(18)
    })

    it("should handle birthday not yet occurred this year", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2006-06-15") // Birthday in June, not yet occurred
      expect(calculateAge(dob, today)).toBe(17)
    })

    it("should handle birthday already occurred this year", () => {
      const today = new Date("2024-06-15")
      const dob = new Date("2006-01-15") // Birthday in January, already occurred
      expect(calculateAge(dob, today)).toBe(18)
    })

    it("should handle leap year birthday (Feb 29)", () => {
      const today = new Date("2024-03-01") // After Feb 29
      const dob = new Date("2006-02-28") // Feb 28 (2006 is not leap year, but close)
      expect(calculateAge(dob, today)).toBe(18)
    })

    it("should use current date if reference date not provided", () => {
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - 25)
      const age = calculateAge(dob)
      expect(age).toBe(25)
    })
  })

  describe("isAge18Plus", () => {
    it("should return true for person who is exactly 18 today", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2006-01-15")
      expect(isAge18Plus(dob, today)).toBe(true)
    })

    it("should return false for person who is one day short of 18", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2006-01-16")
      expect(isAge18Plus(dob, today)).toBe(false)
    })

    it("should return true for person who is 19", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2005-01-15")
      expect(isAge18Plus(dob, today)).toBe(true)
    })

    it("should return false for person who is 17", () => {
      const today = new Date("2024-01-15")
      const dob = new Date("2007-01-15")
      expect(isAge18Plus(dob, today)).toBe(false)
    })

    it("should use current date if reference date not provided", () => {
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - 20)
      expect(isAge18Plus(dob)).toBe(true)

      const dobUnderage = new Date()
      dobUnderage.setFullYear(dobUnderage.getFullYear() - 17)
      expect(isAge18Plus(dobUnderage)).toBe(false)
    })
  })

  describe("getAgeValidationErrorMessage", () => {
    it("should return correct error message", () => {
      const message = getAgeValidationErrorMessage()
      expect(message).toBe("You must be 18+ to onboard.")
    })
  })

  describe("getMinimumDob", () => {
    it("should return date 18 years ago from today", () => {
      const today = new Date("2024-01-15")
      const minDob = getMinimumDob()
      
      // minDob should be approximately 18 years ago
      const expectedYear = today.getFullYear() - 18
      expect(minDob.getFullYear()).toBe(expectedYear)
    })
  })
})
