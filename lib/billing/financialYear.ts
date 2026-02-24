/**
 * Get financial year string for a given date (India FY: Apr 1 - Mar 31)
 * @param date - Date to get FY for (defaults to today)
 * @returns Financial year string like "2025-26"
 */
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12

  // FY starts April 1, so months 1-3 (Jan-Mar) belong to previous FY
  if (month >= 4) {
    // April onwards: FY is current year to next year
    const nextYear = (year + 1) % 100
    return `${year}-${String(nextYear).padStart(2, "0")}`
  } else {
    // Jan-Mar: FY is previous year to current year
    const prevYear = year - 1
    const currentYear = year % 100
    return `${prevYear}-${String(currentYear).padStart(2, "0")}`
  }
}

/**
 * Get start date of financial year for a given date
 */
export function getFinancialYearStart(date: Date = new Date()): Date {
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  if (month >= 4) {
    // April onwards: FY started this year April 1
    return new Date(year, 3, 1) // Month 3 = April (0-indexed)
  } else {
    // Jan-Mar: FY started previous year April 1
    return new Date(year - 1, 3, 1)
  }
}

/**
 * Get end date of financial year for a given date
 */
export function getFinancialYearEnd(date: Date = new Date()): Date {
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  if (month >= 4) {
    // April onwards: FY ends next year March 31
    return new Date(year + 1, 2, 31) // Month 2 = March (0-indexed)
  } else {
    // Jan-Mar: FY ends this year March 31
    return new Date(year, 2, 31)
  }
}
