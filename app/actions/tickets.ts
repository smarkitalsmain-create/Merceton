"use server"

import { revalidatePath } from "next/cache"
import { authorizeRequest, requireMerchant } from "@/lib/auth"
import { requireSuperAdmin, getAdminIdentity } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TicketStatus, TicketPriority, TicketSenderType } from "@prisma/client"
import {
  sendTicketCreatedEmail,
  sendTicketReplyToMerchant,
  sendTicketReplyToAdmin,
} from "@/lib/email/notifications"

const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
})

const replyTicketSchema = z.object({
  ticketId: z.string().min(1),
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
})

const updateTicketSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "PENDING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedToUserId: z.string().optional().nullable(),
})

const addInternalNoteSchema = z.object({
  ticketId: z.string().min(1),
  note: z.string().min(1, "Note is required").max(2000, "Note too long"),
})

/**
 * Create a new support ticket (merchant)
 */
export async function createTicket(input: z.infer<typeof createTicketSchema>) {
  const { merchant, user } = await authorizeRequest()
  // Support tickets = Starter baseline (no gating)
  const validated = createTicketSchema.parse(input)

  // Create ticket with initial message
  const ticket = await prisma.ticket.create({
    data: {
      merchantId: merchant.id,
      subject: validated.subject,
      priority: (validated.priority?.toUpperCase() as TicketPriority) || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      messages: {
        create: {
          senderType: TicketSenderType.MERCHANT,
          senderUserId: user.authUserId,
          message: validated.message,
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  })

  // Send email to internal team
  const ticketNumber = `TKT-${ticket.id.slice(-8).toUpperCase()}`
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/support/${ticket.id}`

  sendTicketCreatedEmail({
    ticketId: ticket.id,
    ticketNumber,
    merchantName: merchant.displayName,
    subject: validated.subject,
    message: validated.message,
    ticketUrl,
  }).catch((err: unknown) => {
    console.error("Failed to send ticket created email:", err)
  })

  revalidatePath("/dashboard/support")
  return { success: true, ticket }
}

/**
 * Reply to a ticket (merchant or admin)
 */
export async function replyToTicket(input: z.infer<typeof replyTicketSchema>) {
  const validated = replyTicketSchema.parse(input)

  // Check if user is merchant or admin
  let isAdmin = false
  let merchantId: string | null = null
  let senderUserId: string
  let senderType: TicketSenderType

  try {
    const admin = await getAdminIdentity()
    if (admin) {
      isAdmin = true
      senderUserId = admin.userId
      senderType = TicketSenderType.ADMIN
    } else {
      const { merchant, user } = await authorizeRequest()
      merchantId = merchant.id
      senderUserId = user.authUserId
      senderType = TicketSenderType.MERCHANT
    }
  } catch {
    throw new Error("Unauthorized")
  }

  // Get ticket and verify access
  const ticket = await prisma.ticket.findUnique({
    where: { id: validated.ticketId },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          users: {
            where: { role: "ADMIN" },
            take: 1,
            select: { email: true },
          },
        },
      },
    },
  })

  if (!ticket) {
    throw new Error("Ticket not found")
  }

  // Merchant can only reply to their own tickets
  if (!isAdmin && ticket.merchantId !== merchantId) {
    throw new Error("Unauthorized")
  }

  // Don't allow replies to closed tickets
  if (ticket.status === TicketStatus.CLOSED) {
    throw new Error("Cannot reply to a closed ticket")
  }

  // Create message
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderType,
      senderUserId,
      message: validated.message,
    },
  })

  // Update ticket status
  let newStatus = ticket.status
  if (isAdmin && ticket.status === TicketStatus.OPEN) {
    newStatus = TicketStatus.PENDING // Admin reply moves to PENDING
  } else if (!isAdmin && ticket.status === TicketStatus.PENDING) {
    newStatus = TicketStatus.OPEN // Merchant reply moves back to OPEN
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: newStatus,
      updatedAt: new Date(),
    },
  })

  // Send email notifications
  const ticketNumber = `TKT-${ticket.id.slice(-8).toUpperCase()}`
  const ticketUrl = isAdmin
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/support/${ticket.id}`
    : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/support/${ticket.id}`

  if (isAdmin) {
    // Admin replied -> notify merchant
    const merchantEmail = ticket.merchant.users[0]?.email
    if (merchantEmail) {
      sendTicketReplyToMerchant({
        to: merchantEmail,
        ticketId: ticket.id,
        ticketNumber,
        subject: ticket.subject,
        replyMessage: validated.message,
        repliedBy: "Support Team",
        ticketUrl,
      }).catch((err: unknown) => {
        console.error("Failed to send ticket reply email:", err)
      })
    }
  } else {
    // Merchant replied -> notify admin
    sendTicketReplyToAdmin({
      ticketId: ticket.id,
      ticketNumber,
      subject: ticket.subject,
      replyMessage: validated.message,
      merchantName: ticket.merchant.displayName,
      ticketUrl,
    }).catch((err: unknown) => {
      console.error("Failed to send ticket reply email:", err)
    })
  }

  revalidatePath("/dashboard/support")
  revalidatePath("/admin/support")
  return { success: true, message }
}

/**
 * Update ticket (admin only)
 */
export async function updateTicket(input: z.infer<typeof updateTicketSchema>) {
  await requireSuperAdmin()
  const validated = updateTicketSchema.parse(input)

  const updateData: any = {
    updatedAt: new Date(),
  }

  if (validated.status !== undefined) {
    updateData.status = validated.status as TicketStatus
    if (validated.status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date()
    } else if (validated.status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date()
    } else {
      updateData.resolvedAt = null
      updateData.closedAt = null
    }
  }

  if (validated.priority !== undefined) {
    updateData.priority = validated.priority as TicketPriority
  }

  if (validated.assignedToUserId !== undefined) {
    updateData.assignedToUserId = validated.assignedToUserId || null
  }

  const ticket = await prisma.ticket.update({
    where: { id: validated.ticketId },
    data: updateData,
  })

  revalidatePath("/admin/support")
  return { success: true, ticket }
}

/**
 * Add internal note (admin only)
 */
export async function addInternalNote(input: z.infer<typeof addInternalNoteSchema>) {
  const admin = await requireSuperAdmin()
  const validated = addInternalNoteSchema.parse(input)

  // Verify ticket exists
  const ticket = await prisma.ticket.findUnique({
    where: { id: validated.ticketId },
  })

  if (!ticket) {
    throw new Error("Ticket not found")
  }

  const note = await prisma.ticketInternalNote.create({
    data: {
      ticketId: validated.ticketId,
      adminUserId: admin.userId,
      note: validated.note,
    },
  })

  revalidatePath("/admin/support")
  return { success: true, note }
}

/**
 * Get tickets for merchant
 */
export async function getMerchantTickets() {
  const merchant = await requireMerchant()
  const tickets = await prisma.ticket.findMany({
    where: { merchantId: merchant.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return tickets
}

/**
 * Get single ticket for merchant
 */
export async function getMerchantTicket(ticketId: string) {
  const merchant = await requireMerchant()

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!ticket || ticket.merchantId !== merchant.id) {
    throw new Error("Ticket not found")
  }

  return ticket
}

/**
 * Get all tickets for admin (super admin only)
 */
export async function getAdminTickets(filters?: {
  status?: TicketStatus
  priority?: TicketPriority
}) {
  await requireSuperAdmin()

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
    },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return tickets
}

/**
 * Get single ticket for admin (super admin only)
 */
export async function getAdminTicket(ticketId: string) {
  await requireSuperAdmin()

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      merchant: {
        select: {
          id: true,
          displayName: true,
          slug: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
      internalNotes: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!ticket) {
    throw new Error("Ticket not found")
  }

  return ticket
}
