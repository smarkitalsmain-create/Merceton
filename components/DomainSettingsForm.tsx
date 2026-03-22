"use client"

import type { DomainStatus } from "@prisma/client"

interface DomainSettingsFormProps {
  merchant: {
    id: string
    customDomain: string | null
    domainStatus: DomainStatus
    domainVerificationToken: string | null
    domainVerifiedAt: Date | null
  }
}

export function DomainSettingsForm({ merchant }: DomainSettingsFormProps) {
  return (
    <div className="rounded-md border p-4 text-sm space-y-2">
      <p>
        <span className="text-muted-foreground">Domain:</span> {merchant.customDomain || "—"}
      </p>
      <p>
        <span className="text-muted-foreground">Status:</span> {merchant.domainStatus}
      </p>
      {merchant.domainVerificationToken && (
        <p className="font-mono text-xs break-all">
          <span className="text-muted-foreground">Verification token:</span> {merchant.domainVerificationToken}
        </p>
      )}
      <p className="text-muted-foreground pt-2">
        Full DNS verification flow is limited in this build. Point your DNS to Merceton when your environment is
        configured.
      </p>
    </div>
  )
}
