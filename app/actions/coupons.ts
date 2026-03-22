"use server"

/** Coupon actions not implemented in this build. */
export async function noopCouponsAction() {
  return { ok: false as const }
}
