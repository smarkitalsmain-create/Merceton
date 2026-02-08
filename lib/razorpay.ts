import Razorpay from "razorpay"

// Lazy initialization to prevent build-time crashes
let razorpayInstance: Razorpay | null = null

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("RAZORPAY_KEY_SECRET is not set")
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

// Export proxy that lazily initializes Razorpay (prevents build-time crashes)
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return getRazorpay()[prop as keyof Razorpay]
  },
})

// Platform fee percentage (default 5%)
export const PLATFORM_FEE_PERCENTAGE = parseFloat(
  process.env.PLATFORM_FEE_PERCENTAGE || "5"
)

export function calculatePlatformFee(amount: number): number {
  return (amount * PLATFORM_FEE_PERCENTAGE) / 100
}

export function calculateMerchantPayout(totalAmount: number): number {
  const platformFee = calculatePlatformFee(totalAmount)
  return totalAmount - platformFee
}
