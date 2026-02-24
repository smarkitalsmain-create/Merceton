"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

interface DownloadInvoiceButtonProps {
  orderId: string
}

export function DownloadInvoiceButton({ orderId }: DownloadInvoiceButtonProps) {
  return (
    <Link href={`/dashboard/orders/${orderId}/invoice`} target="_blank">
      <Button variant="outline" size="sm">
        <FileText className="mr-2 h-4 w-4" />
        Invoice
      </Button>
    </Link>
  )
}
