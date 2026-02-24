/**
 * Unit tests for CSV product import parsing and validation
 */

import { describe, it, expect } from "vitest"
import {
  validateCsvRow,
  detectDuplicatesWithinFile,
  normalizeHeaders,
  parseCsvRow,
} from "@/lib/products/csvImport"

describe("CSV Import Utilities", () => {
  describe("normalizeHeaders", () => {
    it("should normalize headers to lowercase and trim", () => {
      const headers = ["  Name  ", "PRICE", "  SKU  "]
      const normalized = normalizeHeaders(headers)
      expect(normalized).toEqual(["name", "price", "sku"])
    })
  })

  describe("parseCsvRow", () => {
    it("should parse CSV row into object with normalized headers", () => {
      const headers = ["name", "price", "sku"]
      const row = ["Product 1", "99.99", "SKU-001"]
      const parsed = parseCsvRow(row, headers)
      expect(parsed).toEqual({
        name: "Product 1",
        price: "99.99",
        sku: "SKU-001",
      })
    })

    it("should handle empty values as null", () => {
      const headers = ["name", "price", "sku"]
      const row = ["Product 1", "99.99", ""]
      const parsed = parseCsvRow(row, headers)
      expect(parsed.sku).toBeNull()
    })
  })

  describe("validateCsvRow", () => {
    it("should validate a valid row", () => {
      const row = {
        name: "Test Product",
        price: "99.99",
        sku: "SKU-001",
        description: "Test description",
        stock: "100",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.data.name).toBe("Test Product")
      expect(result.data.price).toBe(99.99)
    })

    it("should reject row with missing name", () => {
      const row = {
        price: "99.99",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.includes("name"))).toBe(true)
    })

    it("should reject row with missing price", () => {
      const row = {
        name: "Test Product",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.includes("price"))).toBe(true)
    })

    it("should reject row with invalid price (negative)", () => {
      const row = {
        name: "Test Product",
        price: "-10",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("price") || e.includes("positive"))).toBe(true)
    })

    it("should reject row with invalid price (zero)", () => {
      const row = {
        name: "Test Product",
        price: "0",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes("price") || e.includes("positive"))).toBe(true)
    })

    it("should accept optional fields", () => {
      const row = {
        name: "Test Product",
        price: "99.99",
        sku: "SKU-001",
        description: "Description",
        stock: "50",
        mrp: "149.99",
        hsnOrSac: "12345678",
        gstRate: "18",
        isTaxable: "true",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(true)
      expect(result.data.sku).toBe("SKU-001")
      expect(result.data.description).toBe("Description")
      expect(result.data.stock).toBe(50)
    })

    it("should coerce numeric fields", () => {
      const row = {
        name: "Test Product",
        price: "99.99",
        stock: "100",
        gstRate: "18",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(true)
      expect(typeof result.data.price).toBe("number")
      expect(typeof result.data.stock).toBe("number")
      expect(typeof result.data.gstRate).toBe("number")
    })

    it("should coerce boolean fields", () => {
      const row = {
        name: "Test Product",
        price: "99.99",
        isTaxable: "true",
      }
      const result = validateCsvRow(row, 1)
      expect(result.isValid).toBe(true)
      expect(result.data.isTaxable).toBe(true)
    })
  })

  describe("detectDuplicatesWithinFile", () => {
    it("should detect duplicate SKUs within file", () => {
      const rows = [
        { rowNumber: 1, data: { name: "Product 1", price: 10, sku: "SKU-001" }, isValid: true, errors: [] },
        { rowNumber: 2, data: { name: "Product 2", price: 20, sku: "SKU-002" }, isValid: true, errors: [] },
        { rowNumber: 3, data: { name: "Product 3", price: 30, sku: "SKU-001" }, isValid: true, errors: [] },
        { rowNumber: 4, data: { name: "Product 4", price: 40, sku: "SKU-003" }, isValid: true, errors: [] },
      ]
      const duplicates = detectDuplicatesWithinFile(rows)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].rowNumber).toBe(3)
      expect(duplicates[0].sku).toBe("SKU-001")
    })

    it("should not flag rows without SKUs as duplicates", () => {
      const rows = [
        { rowNumber: 1, data: { name: "Product 1", price: 10 }, isValid: true, errors: [] },
        { rowNumber: 2, data: { name: "Product 2", price: 20 }, isValid: true, errors: [] },
      ]
      const duplicates = detectDuplicatesWithinFile(rows)
      expect(duplicates).toHaveLength(0)
    })

    it("should handle case-insensitive duplicate detection", () => {
      const rows = [
        { rowNumber: 1, data: { name: "Product 1", price: 10, sku: "SKU-001" }, isValid: true, errors: [] },
        { rowNumber: 2, data: { name: "Product 2", price: 20, sku: "sku-001" }, isValid: true, errors: [] },
      ]
      const duplicates = detectDuplicatesWithinFile(rows)
      expect(duplicates).toHaveLength(1)
    })

    it("should flag all occurrences except the first", () => {
      const rows = [
        { rowNumber: 1, data: { name: "Product 1", price: 10, sku: "SKU-001" }, isValid: true, errors: [] },
        { rowNumber: 2, data: { name: "Product 2", price: 20, sku: "SKU-001" }, isValid: true, errors: [] },
        { rowNumber: 3, data: { name: "Product 3", price: 30, sku: "SKU-001" }, isValid: true, errors: [] },
      ]
      const duplicates = detectDuplicatesWithinFile(rows)
      expect(duplicates).toHaveLength(2)
      expect(duplicates.map((d) => d.rowNumber)).toEqual([2, 3])
    })
  })
})
