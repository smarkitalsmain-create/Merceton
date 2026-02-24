/**
 * PAN (Permanent Account Number) Validation Rules
 * 
 * PAN format: ABCDE1234F (10 characters)
 * - First 3 chars: Letters (A-Z)
 * - Next 1 char: Entity type indicator (4th character)
 * - Next 1 char: First letter of surname/name (5th character)
 * - Next 4 chars: Numbers (0001-9999)
 * - Last 1 char: Check digit (A-Z)
 * 
 * 4th Character Rules:
 * - Individual -> P
 * - Company -> C
 * - Partnership/Firm -> F
 * - LLP -> F (treated as Firm for PAN purposes)
 * - HUF -> H
 * - Trust -> T
 * - AOP (Association of Persons) -> A
 * - BOI (Body of Individuals) -> A (treated as AOP)
 */

export type PanType =
  | "INDIVIDUAL"
  | "COMPANY"
  | "PARTNERSHIP"
  | "LLP"
  | "HUF"
  | "TRUST"
  | "AOP"
  | "BOI"

/**
 * Mapping of PAN type to expected 4th character
 */
export const PAN_TYPE_TO_4TH_CHAR: Record<PanType, string> = {
  INDIVIDUAL: "P",
  COMPANY: "C",
  PARTNERSHIP: "F",
  LLP: "F", // LLP is treated as Firm for PAN 4th char
  HUF: "H",
  TRUST: "T",
  AOP: "A",
  BOI: "A", // BOI is treated as AOP for PAN 4th char
}

/**
 * Get expected 4th character for a PAN type
 */
export function getExpectedPan4thChar(panType: PanType): string {
  return PAN_TYPE_TO_4TH_CHAR[panType]
}

/**
 * Validate PAN 4th character matches PAN type
 * @param panNumber - PAN number (10 characters, uppercase)
 * @param panType - Selected PAN type
 * @returns true if valid, false otherwise
 */
export function validatePan4thChar(panNumber: string, panType: PanType): boolean {
  if (panNumber.length < 4) {
    return false
  }

  const actual4thChar = panNumber[3] // 0-indexed, so 3rd index is 4th character
  const expected4thChar = getExpectedPan4thChar(panType)

  return actual4thChar === expected4thChar
}

/**
 * Get validation error message for PAN type mismatch
 */
export function getPanTypeMismatchMessage(panNumber: string, panType: PanType): string {
  const actual4thChar = panNumber[3]
  const expected4thChar = getExpectedPan4thChar(panType)

  const panTypeLabels: Record<PanType, string> = {
    INDIVIDUAL: "Individual",
    COMPANY: "Company",
    PARTNERSHIP: "Partnership/Firm",
    LLP: "LLP",
    HUF: "HUF",
    TRUST: "Trust",
    AOP: "AOP",
    BOI: "BOI",
  }

  return `PAN type mismatch: 4th character should be '${expected4thChar}' for ${panTypeLabels[panType]}, but found '${actual4thChar}'`
}

/**
 * Validate GST contains PAN
 * GST format: 27ABCDE1234F1Z5 (15 characters)
 * - First 2 chars: State code (00-99)
 * - Next 10 chars: PAN (characters 3-12 of GST)
 * - Next 1 char: Entity number (1-9, A-Z)
 * - Next 1 char: 'Z' (fixed)
 * - Last 1 char: Check digit (0-9, A-Z)
 * 
 * @param gstin - GSTIN (15 characters, uppercase)
 * @param panNumber - PAN number (10 characters, uppercase)
 * @returns true if GST contains PAN, false otherwise
 */
export function validateGstContainsPan(gstin: string, panNumber: string): boolean {
  if (gstin.length < 12 || panNumber.length !== 10) {
    return false
  }

  // GST characters 3-12 (0-indexed: 2 to 11) should equal PAN
  const gstPanPart = gstin.substring(2, 12)
  return gstPanPart === panNumber
}

/**
 * Get validation error message for GST/PAN mismatch
 */
export function getGstPanMismatchMessage(): string {
  return "GST does not match PAN (GST must contain PAN as characters 3–12)"
}
