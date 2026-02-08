/**
 * Simple logging utility for MVP
 * For production, consider using a proper logging service (Sentry, LogRocket, etc.)
 */

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage("info", message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = error instanceof Error
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error }
    console.error(this.formatMessage("error", message, errorContext))
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context))
    }
  }
}

export const logger = new Logger()
