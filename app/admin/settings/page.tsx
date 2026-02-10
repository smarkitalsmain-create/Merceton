export const runtime = "nodejs"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { PlatformSettingsForm } from "@/components/admin/PlatformSettingsForm"

export default async function AdminSettingsPage() {
  await requireSuperAdmin()

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
  })

  // If no settings exist, use defaults (will be created on first save)
  const platformSettings = settings || {
    id: "singleton",
    defaultFeePercentageBps: 200, // 2%
    defaultFeeFlatPaise: 500, // ₹5
    defaultFeeMaxCapPaise: 2500, // ₹25
    updatedAt: new Date(),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide defaults</p>
      </div>

      <PlatformSettingsForm initialSettings={platformSettings} />
    </div>
  )
}
