export function logError(scope: string, err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    // In development, log full error details
    // eslint-disable-next-line no-console
    console.error(`[${scope}]`, err)
  }
  // In production, this is a no-op for now or can be wired to a real logger provider.
}

