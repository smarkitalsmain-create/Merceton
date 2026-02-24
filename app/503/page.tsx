import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function ServiceUnavailablePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Service Temporarily Unavailable</CardTitle>
          <CardDescription className="mt-2">
            Merceton is temporarily unavailable. Please try again in a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re experiencing technical difficulties. Our team has been notified and is working to resolve the issue.
          </p>
          <div className="pt-4">
            <a
              href="/"
              className="text-sm text-primary hover:underline"
            >
              Return to home page
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
