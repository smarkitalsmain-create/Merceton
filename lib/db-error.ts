/**
 * Database error detection and handling utilities
 * Helps identify Prisma connection errors and handle them gracefully
 */

import { Prisma } from "@prisma/client"

/**
 * Check if an error is a database connection/unreachable error
 */
export function isDbDownError(error: unknown): boolean {
  // PrismaClientInitializationError with P1001 code
  if (error instanceof Prisma.PrismaClientInitializationError) {
    // P1001: Can't reach database server
    // P1008: Operations timed out
    // P1017: Server has closed the connection
    const code = (error as any).errorCode
    return code === "P1001" || code === "P1008" || code === "P1017"
  }

  // Check error message for connection-related keywords
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("can't reach database") ||
      message.includes("database server") ||
      message.includes("connection refused") ||
      message.includes("timeout") ||
      message.includes("unreachable") ||
      message.includes("p1001")
    )
  }

  return false
}

/**
 * Get a user-friendly error message for DB errors
 */
export function getDbErrorMessage(error: unknown): string {
  if (isDbDownError(error)) {
    return "Database is temporarily unavailable. Please try again in a few minutes."
  }
  return "A database error occurred. Please try again later."
}
