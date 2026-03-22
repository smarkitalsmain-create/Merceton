import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminAuditLogsPlaceholderPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Audit logs</h1>
      <p className="text-muted-foreground">This admin route is a placeholder in this build.</p>
      <Button asChild variant="outline">
        <Link href="/_admin/settings">Back to settings</Link>
      </Button>
    </div>
  )
}
