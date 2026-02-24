export const runtime = "nodejs"

import { requireMerchant } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BankAccountForm } from "@/components/bank/BankAccountForm"

export default async function BankSettingsPage() {
  const merchant = await requireMerchant()

  const bankAccount = await prisma.merchantBankAccount.findUnique({
    where: { merchantId: merchant.id },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bank Account</h1>
        <p className="text-muted-foreground">
          Configure the bank account used for settlements and payouts.
        </p>
      </div>

      <BankAccountForm bankAccount={bankAccount} />
    </div>
  )
}

