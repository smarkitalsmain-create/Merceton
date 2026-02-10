export function formatMoney(value?: number | string | null): string {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(2) : "0.00"
}

