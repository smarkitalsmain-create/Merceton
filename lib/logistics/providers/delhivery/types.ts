export interface DelhiveryPincodeResponse {
  // The real API returns an object with a `delivery_codes` array.
  // We keep this loose and map in mappers.ts.
  delivery_codes?: any[]
  [key: string]: any
}

export type DelhiveryWarehouseRequest = any

export type DelhiveryWarehouseResponse = any

export type DelhiveryShipmentCreateRequest = any

export type DelhiveryShipmentCreateResponse = any

export type DelhiveryTrackingResponse = any

