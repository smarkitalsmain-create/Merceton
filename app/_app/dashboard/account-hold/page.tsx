import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const runtime = "nodejs"

export default async function AccountHoldPage() {
  const merchant = await requireMerchant()

  const dbMerchant = await prisma.merchant.findUnique({
    where: { id: merchant.id },
    select: {
      accountStatus: true,
      holdReasonCode: true,
      holdReasonText: true,
      holdAppliedAt: true,
    },
  })

  const reason = dbMerchant?.holdReasonText ?? dbMerchant?.holdReasonCode ?? null

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Account on Hold</CardTitle>
          <CardDescription>
            Your Merceton account is currently under review and some actions are temporarily disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason && (
            <div>
              <p className="text-sm font-medium">Reason provided:</p>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{reason}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake or need more information, please contact support at{" "}
            <a href="mailto:support@merceton.com" className="text-primary underline">
              support@merceton.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

