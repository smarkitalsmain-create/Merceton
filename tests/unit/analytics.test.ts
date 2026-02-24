/**
 * Unit tests for analytics aggregation logic
 */

import { describe, it, expect } from "vitest"

describe("Analytics Aggregation", () => {
  describe("Sales by Product", () => {
    it("should calculate total revenue correctly", () => {
      const items = [
        { productId: "p1", quantity: 2, price: 10000 }, // ₹100 × 2 = ₹200
        { productId: "p1", quantity: 1, price: 10000 }, // ₹100 × 1 = ₹100
        { productId: "p2", quantity: 3, price: 5000 }, // ₹50 × 3 = ₹150
      ]

      const productMap = new Map<
        string,
        { totalQuantity: number; totalRevenue: number; orderIds: Set<string> }
      >()

      for (const item of items) {
        const existing = productMap.get(item.productId) || {
          totalQuantity: 0,
          totalRevenue: 0,
          orderIds: new Set<string>(),
        }

        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.price * item.quantity // price in paise
        existing.orderIds.add("order-1")

        productMap.set(item.productId, existing)
      }

      const p1 = productMap.get("p1")!
      const p2 = productMap.get("p2")!

      expect(p1.totalQuantity).toBe(3)
      expect(p1.totalRevenue).toBe(30000) // ₹300 in paise
      expect(p2.totalQuantity).toBe(3)
      expect(p2.totalRevenue).toBe(15000) // ₹150 in paise
    })
  })

  describe("Conversion Rate", () => {
    it("should calculate conversion rate correctly", () => {
      const totalOrders = 100
      const paidOrders = 75

      const conversionRate = (paidOrders / totalOrders) * 100

      expect(conversionRate).toBe(75)
    })

    it("should handle zero orders", () => {
      const totalOrders = 0
      const paidOrders = 0

      const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0

      expect(conversionRate).toBe(0)
    })
  })

  describe("Date Grouping", () => {
    it("should group by day correctly", () => {
      const date = new Date("2024-01-15T10:00:00Z")
      const dateKey = date.toISOString().split("T")[0]

      expect(dateKey).toBe("2024-01-15")
    })

    it("should group by month correctly", () => {
      const date = new Date("2024-01-15T10:00:00Z")
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      expect(dateKey).toBe("2024-01")
    })
  })
})
