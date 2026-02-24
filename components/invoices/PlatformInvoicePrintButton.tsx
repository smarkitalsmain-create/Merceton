"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PlatformInvoicePrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button onClick={handlePrint} variant="outline" size="sm">
      <Printer className="h-4 w-4 mr-2" />
      Print / Save as PDF
    </Button>
  )
}
