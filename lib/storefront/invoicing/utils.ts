import { Order, OrderStage } from "@prisma/client"

/**
 * Check if an order is cancelled
 * Uses order.stage === "CANCELLED" from OrderStage enum
 */
export function isOrderCancelled(order: { stage: OrderStage }): boolean {
  return order.stage === "CANCELLED"
}

/**
 * Get invoice watermark text if order is cancelled
 */
export function getInvoiceWatermark(order: { stage: OrderStage }): string | null {
  return isOrderCancelled(order) ? "CANCELLED" : null
}
