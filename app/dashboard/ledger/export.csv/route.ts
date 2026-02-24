import { NextRequest } from "next/server"
import { requireMerchant } from "@/lib/auth"
import { exportMerchantLedgerCsv } from "@/lib/ledger/exportMerchantLedgerCsv"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const merchant = await requireMerchant()
  const { searchParams } = new URL(request.url)

  const from = searchParams.get("from") || undefined
  const to = searchParams.get("to") || undefined
  const type = searchParams.get("type") || undefined

  const { filename, csv } = await exportMerchantLedgerCsv({
    merchantId: merchant.id,
    from,
    to,
    type,
  })

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

