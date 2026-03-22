import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WarehouseList } from "@/components/logistics/WarehouseList"

export default async function LogisticsSettingsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logistics & Shipping</h1>
        <p className="text-muted-foreground text-sm">
          Manage your pickup locations and prepare for courier integrations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Pickup locations</CardTitle>
            <CardDescription>Configure the warehouse or address used as your shipping origin.</CardDescription>
          </CardHeader>
          <CardContent>
            <WarehouseList />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Shipping provider</CardTitle>
            <CardDescription>
              Delhivery is currently used as the default provider. Support for more providers is coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Your shipping provider is managed by the Merceton team today. In a future
              update, you&apos;ll be able to connect and configure multiple providers
              (e.g., Delhivery, Blue Dart, DTDC, XpressBees) from here.
            </p>
            <p>
              If you need to update your provider configuration, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

