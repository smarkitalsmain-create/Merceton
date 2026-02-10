/**
 * Currency utilities for converting between paise (integer) and INR (decimal)
 */

/**
 * Convert INR (decimal) to paise (integer)
 * @param inr - Price in INR (e.g., 599.99)
 * @returns Price in paise (e.g., 59999)
 */
export function inrToPaise(inr: number): number {
  return Math.round(inr * 100)
}

/**
 * Convert paise (integer) to INR (decimal)
 * @param paise - Price in paise (e.g., 59999)
 * @returns Price in INR (e.g., 599.99)
 */
export function paiseToInr(paise: number): number {
  return paise / 100
}

/**
 * Format paise as INR currency string
 * @param paise - Price in paise
 * @returns Formatted string (e.g., "₹599.99")
 */
export function formatCurrency(paise: number): string {
  const num = Number(paiseToInr(paise))
  return `₹${Number.isFinite(num) ? num.toFixed(2) : "0.00"}`
}

/**
 * Format paise as INR currency string without symbol
 * @param paise - Price in paise
 * @returns Formatted string (e.g., "599.99")
 */
export function formatCurrencyValue(paise: number): string {
  const num = Number(paiseToInr(paise))
  return Number.isFinite(num) ? num.toFixed(2) : "0.00"
}
