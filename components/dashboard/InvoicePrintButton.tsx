"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function InvoicePrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button onClick={handlePrint} className="print-hide">
      <Printer className="mr-2 h-4 w-4" />
      Print / Save as PDF
    </Button>
  )
}
