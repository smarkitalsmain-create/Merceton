/**
 * Age Validation Utilities
 * 
 * Validates that a user is 18+ years old based on date of birth.
 */

/**
 * Calculate age from date of birth
 * Uses exact date difference (not just year difference)
 * @param dob - Date of birth
 * @param referenceDate - Reference date (defaults to today)
 * @returns Age in years
 */
export function calculateAge(dob: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - dob.getFullYear()
  const monthDiff = referenceDate.getMonth() - dob.getMonth()
  
  // If birthday hasn't occurred this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--
  }
  
  return age
}

/**
 * Check if user is 18+ years old
 * @param dob - Date of birth
 * @param referenceDate - Reference date (defaults to today)
 * @returns true if age >= 18
 */
export function isAge18Plus(dob: Date, referenceDate: Date = new Date()): boolean {
  const age = calculateAge(dob, referenceDate)
  return age >= 18
}

/**
 * Get validation error message for underage users
 */
export function getAgeValidationErrorMessage(): string {
  return "You must be 18+ to onboard."
}

/**
 * Get minimum allowed date of birth (18 years ago from today)
 */
export function getMinimumDob(): Date {
  const today = new Date()
  const minDate = new Date(today)
  minDate.setFullYear(today.getFullYear() - 18)
  return minDate
}
