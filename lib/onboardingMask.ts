export function maskPan(pan?: string | null): string {
  if (!pan || pan.length < 6) return pan || ""
  // Show first 5 and last 1 characters, mask middle 4
  return `${pan.slice(0, 5)}****${pan.slice(-1)}`
}

export function maskGstin(gstin?: string | null): string {
  if (!gstin || gstin.length < 6) return gstin || ""
  // Show first 2 and last 2 characters, mask middle
  const start = gstin.slice(0, 2)
  const end = gstin.slice(-2)
  const maskedMiddle = "*".repeat(Math.max(0, gstin.length - 4))
  return `${start}${maskedMiddle}${end}`
}

