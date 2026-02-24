"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateRangeControlsProps {
  from: string
  to: string
  onChangeFrom: (value: string) => void
  onChangeTo: (value: string) => void
}

export function DateRangeControls({
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: DateRangeControlsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="billing-from">From Date</Label>
        <Input
          id="billing-from"
          type="date"
          value={from}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="billing-to">To Date</Label>
        <Input
          id="billing-to"
          type="date"
          value={to}
          onChange={(e) => onChangeTo(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  )
}
