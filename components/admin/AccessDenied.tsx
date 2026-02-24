"use client"

import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AccessDeniedProps {
  allowlistConfigured?: boolean
}

export function AccessDenied({ allowlistConfigured = true }: AccessDeniedProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/admin/sign-in")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Your email is not authorized to access the Super Admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!allowlistConfigured ? (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>SUPER_ADMIN_EMAILS</strong> is empty. Add comma-separated emails in <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> and restart dev server.
                <br />
                <br />
                Example: <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAILS=&quot;admin@merceton.com,sanket@smarkitalstech.com&quot;</code>
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only emails listed in <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAILS</code> can access this area.
            </p>
          )}
          <Button onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
