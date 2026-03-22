import type { LogisticsProviderKey } from "@/lib/logistics/types"
import type { ShippingProvider } from "@/lib/logistics/providers/base"
import { DelhiveryProvider } from "@/lib/logistics/providers/delhivery/provider"
import { ProviderUnavailableError } from "@/lib/logistics/errors"

const providers: Partial<Record<LogisticsProviderKey, ShippingProvider>> = {}

export function getShippingProvider(key: LogisticsProviderKey = "delhivery"): ShippingProvider {
  if (!providers[key]) {
    switch (key) {
      case "delhivery":
        providers[key] = new DelhiveryProvider()
        break
      default:
        throw new ProviderUnavailableError(`Logistics provider '${key}' is not configured`)
    }
  }
  return providers[key]!
}

