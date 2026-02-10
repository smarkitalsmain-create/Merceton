'use server'

import { revalidatePath } from 'next/cache'
import { requireMerchant } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function publishStorefront() {
  const merchant = await requireMerchant()

  await prisma.storefrontSettings.update({
    where: { merchantId: merchant.id },
    data: {
      publishedAt: new Date(),
    },
  })

  revalidatePath('/dashboard/storefront')
  revalidatePath(`/s/${merchant.slug}`)
}

export async function unpublishStorefront() {
  const merchant = await requireMerchant()

  await prisma.storefrontSettings.update({
    where: { merchantId: merchant.id },
    data: {
      publishedAt: null,
    },
  })

  revalidatePath('/dashboard/storefront')
  revalidatePath(`/s/${merchant.slug}`)
}
