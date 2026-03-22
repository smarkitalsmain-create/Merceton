import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MerchantAuditTab({ merchantId }: { merchantId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Detailed audit timeline for merchant <span className="font-mono">{merchantId}</span> is not loaded in
        this build. Use the platform audit log export when available.
      </CardContent>
    </Card>
  )
}
