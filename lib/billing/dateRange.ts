/**
 * Get default month range for IST (Asia/Kolkata)
 * Returns first day to last day of current month
 */
export function getDefaultMonthRangeIST(): { from: string; to: string } {
  const today = new Date()
  
  // Get current month in IST (Asia/Kolkata is UTC+5:30)
  // For simplicity, use local date which should be IST if server is configured correctly
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  return {
    from: firstDay.toISOString().slice(0, 10), // YYYY-MM-DD
    to: lastDay.toISOString().slice(0, 10),
  }
}

/**
 * Validate date range
 * Returns true if from <= to and both are valid dates
 */
export function validateRange(from: string, to: string): boolean {
  if (!from || !to) return false
  
  const fromDate = new Date(from)
  const toDate = new Date(to)
  
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return false
  }
  
  return fromDate <= toDate
}
