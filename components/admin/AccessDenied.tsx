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
                Super admin access is not configured. Set <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAIL</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAILS</code> in <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> / <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> and restart.
                <br />
                <br />
                Example (single): <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAIL=admin@merceton.com</code>
                <br />
                Example (multiple): <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAILS=admin@merceton.com,other@example.com</code>
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only emails listed in <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAIL</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAILS</code> can access this area.
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
