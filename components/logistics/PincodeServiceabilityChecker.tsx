"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  checkPincodeServiceability,
  ServiceabilityResultClient,
  ServiceabilityStatus,
} from "@/lib/frontend/logistics"

interface PincodeServiceabilityCheckerProps {
  className?: string
  label?: string
  helperText?: string
}

export function PincodeServiceabilityChecker({
  className,
  label = "Check delivery to your pincode",
  helperText = "Enter a 6-digit Indian pincode to check if delivery is available.",
}: PincodeServiceabilityCheckerProps) {
  const [pincode, setPincode] = useState("")
  const [status, setStatus] = useState<ServiceabilityStatus>("idle")
  const [message, setMessage] = useState<string | null>(null)

  const disabled = status === "checking"

  const handleCheck = async () => {
    setStatus("checking")
    setMessage(null)
    const result: ServiceabilityResultClient = await checkPincodeServiceability(pincode)
    if (process.env.NODE_ENV === "development") {
      console.error("[serviceability:ui]", {
        pincode,
        derivedStatus: result.status,
        message: result.message,
      })
    }
    setStatus(result.status)
    setMessage(result.message)
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!disabled) {
        handleCheck()
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <Input
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={onKeyDown}
            disabled={disabled}
            aria-label="Pincode"
          />
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="whitespace-nowrap"
          disabled={disabled || pincode.trim().length !== 6}
          onClick={handleCheck}
        >
          {status === "checking" ? "Checking..." : "Check"}
        </Button>
      </div>

      {status !== "idle" && message && (
        <div className="flex items-center gap-2 text-xs">
          <Badge
            variant={
              status === "serviceable"
                ? "default"
                : status === "not_serviceable"
                ? "destructive"
                : status === "error"
                ? "destructive"
                : "outline"
            }
          >
            {status === "serviceable" && "Serviceable"}
            {status === "not_serviceable" && "Not serviceable"}
            {status === "temporarily_unavailable" && "Unavailable"}
            {status === "error" && "Error"}
            {status === "checking" && "Checking"}
          </Badge>
          <span className="text-muted-foreground">{message}</span>
        </div>
      )}
    </div>
  )
}

