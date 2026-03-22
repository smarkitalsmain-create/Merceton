export class LogisticsError extends Error {
  public readonly code: string
  public readonly causeError?: unknown
  public readonly status: number

  constructor(message: string, code: string, status = 500, causeError?: unknown) {
    super(message)
    this.name = "LogisticsError"
    this.code = code
    this.status = status
    this.causeError = causeError
  }
}

export class ValidationError extends LogisticsError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
  }
}

export class ProviderAuthError extends LogisticsError {
  constructor(message = "Logistics provider authentication failed") {
    super(message, "PROVIDER_AUTH_ERROR", 401)
    this.name = "ProviderAuthError"
  }
}

export class ProviderRateLimitError extends LogisticsError {
  constructor(message = "Logistics provider rate limit exceeded") {
    super(message, "PROVIDER_RATE_LIMIT_ERROR", 429)
    this.name = "ProviderRateLimitError"
  }
}

export class ProviderUnavailableError extends LogisticsError {
  constructor(message = "Logistics provider is currently unavailable") {
    super(message, "PROVIDER_UNAVAILABLE_ERROR", 503)
    this.name = "ProviderUnavailableError"
  }
}

export class ProviderBadResponseError extends LogisticsError {
  constructor(message = "Unexpected response from logistics provider", cause?: unknown) {
    super(message, "PROVIDER_BAD_RESPONSE_ERROR", 502, cause)
    this.name = "ProviderBadResponseError"
  }
}

