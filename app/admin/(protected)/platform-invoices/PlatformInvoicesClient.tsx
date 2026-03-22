"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type MerchantOption = {
  id: string
  displayName: string
  users: { email: string }[]
}

export function PlatformInvoicesClient({ merchants }: { merchants: MerchantOption[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>On-demand invoices</CardTitle>
        <CardDescription>
          Generate platform fee invoices for a merchant when the billing job is enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {merchants.length} active merchant(s) in directory. Full PDF generation UI is not wired in this build.
      </CardContent>
    </Card>
  )
}
