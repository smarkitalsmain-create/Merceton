import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MaintenanceModeProps {
  storeName?: string | null
  message?: string | null
}

export function MaintenanceMode({ storeName, message }: MaintenanceModeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Store Temporarily Unavailable</CardTitle>
          <CardDescription>
            {storeName ? `${storeName} is currently under maintenance.` : "This store is currently under maintenance."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            We&apos;re working hard to improve your shopping experience. Please check back soon!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
