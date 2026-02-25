/**
 * Parse period range for admin reports (tickets, etc.).
 * Supports: 7d, 30d, 90d, this_month, last_month, or from/to ISO strings.
 */

export type RangePreset = "7d" | "30d" | "90d" | "this_month" | "last_month"

export interface DateRange {
  from: Date
  to: Date
}

function startOfMonth(d: Date): Date {
  const out = new Date(d)
  out.setUTCDate(1)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

function endOfMonth(d: Date): Date {
  const out = new Date(d)
  out.setUTCMonth(out.getUTCMonth() + 1)
  out.setUTCDate(0)
  out.setUTCHours(23, 59, 59, 999)
  return out
}

export function parseRange(params: {
  range?: string
  from?: string
  to?: string
}): DateRange {
  const now = new Date()
  const fromIso = params.from?.trim()
  const toIso = params.to?.trim()
  if (fromIso && toIso) {
    const from = new Date(fromIso)
    const to = new Date(toIso)
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { from, to }
    }
  }

  const preset = (params.range ?? "30d").toLowerCase() as RangePreset
  switch (preset) {
    case "7d": {
      const to = new Date(now)
      const from = new Date(now)
      from.setDate(from.getDate() - 7)
      from.setHours(0, 0, 0, 0)
      return { from, to }
    }
    case "30d": {
      const to = new Date(now)
      const from = new Date(now)
      from.setDate(from.getDate() - 30)
      from.setHours(0, 0, 0, 0)
      return { from, to }
    }
    case "90d": {
      const to = new Date(now)
      const from = new Date(now)
      from.setDate(from.getDate() - 90)
      from.setHours(0, 0, 0, 0)
      return { from, to }
    }
    case "this_month": {
      const from = startOfMonth(now)
      const to = new Date(now)
      return { from, to }
    }
    case "last_month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1)
      const from = startOfMonth(prev)
      const to = endOfMonth(prev)
      return { from, to }
    }
    default:
      const to = new Date(now)
      const from = new Date(now)
      from.setDate(from.getDate() - 30)
      from.setHours(0, 0, 0, 0)
      return { from, to }
  }
}

export function rangeToIso(range: DateRange): { from: string; to: string } {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }
}
