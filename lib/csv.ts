/**
 * Escape a value for safe usage in CSV.
 * - Wraps in double quotes
 * - Escapes internal quotes
 */
export function escapeCsv(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Convert header + rows to CSV string.
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines: string[] = []
  lines.push(headers.map(escapeCsv).join(","))
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","))
  }
  return lines.join("\n")
}

