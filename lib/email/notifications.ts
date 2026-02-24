import { sendEmail } from "./mailer";
import {
  orderConfirmationTemplate,
  shipmentUpdateTemplate,
  refundInitiatedTemplate,
  passwordResetTemplate,
  payoutProcessedTemplate,
  commissionSummaryTemplate,
  internalHighValueOrderTemplate,
  internalWebhookFailureTemplate,
  internalRefundThresholdTemplate,
  internalNewMerchantSignupTemplate,
  newOrderForMerchantTemplate,
} from "@/emails";
import {
  accountOnHoldEmail,
  kycApprovedEmail,
  holdReleasedEmail,
  ticketCreatedTemplate,
  ticketReplyTemplate,
} from "@/emails";

// TODO: Persist email logs to DB (status, type, recipient, entityId, error).

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmailToCustomer(params: {
  to: string;
  customerName: string;
  orderId: string; // Internal ID (for tracking)
  orderNumber: string; // Human-readable order number (required for display)
  orderDate?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  totalAmount: number;
  currency?: string;
  storeName?: string;
}) {
  const html = orderConfirmationTemplate(params);
  const subject = `Order Confirmed - ${params.orderNumber}`;

  return sendEmail({
    channel: "orders",
    to: params.to,
    subject,
    html,
    replyTo: "support@merceton.com",
    tags: [
      { name: "type", value: "order_confirmation" },
      { name: "order_id", value: params.orderId },
    ],
  });
}

/**
 * @deprecated Use sendOrderConfirmationEmailToCustomer instead
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  orderNumber: string; // Add required orderNumber
  orderDate?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  totalAmount: number;
  currency?: string;
  storeName?: string;
}) {
  return sendOrderConfirmationEmailToCustomer(params);
}

/**
 * Send shipment update email to customer
 */
export async function sendShipmentUpdateEmail(params: {
  to: string;
  customerName: string;
  orderId: string; // Internal ID (for tracking)
  orderNumber: string; // Human-readable order number (required for display)
  carrier?: string;
  trackingId?: string;
  trackingUrl?: string;
  eta?: string;
  storeName?: string;
}) {
  const html = shipmentUpdateTemplate(params);
  const subject = `Your Order ${params.orderNumber} Has Shipped`;

  return sendEmail({
    channel: "orders",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "shipment_update" },
      { name: "order_id", value: params.orderId },
    ],
  });
}

/**
 * Send refund initiated email to customer
 */
export async function sendRefundInitiatedEmail(params: {
  to: string;
  customerName: string;
  orderId: string; // Internal ID (for tracking)
  orderNumber: string; // Human-readable order number (required for display)
  refundAmount: number;
  currency?: string;
  refundMode?: string;
  expectedTimeline?: string;
  storeName?: string;
}) {
  const html = refundInitiatedTemplate(params);
  const subject = `Refund Initiated for Order ${params.orderNumber}`;

  return sendEmail({
    channel: "finance",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "refund_initiated" },
      { name: "order_id", value: params.orderId },
    ],
  });
}

/**
 * Send password reset email
 * 
 * NOTE: Currently password reset is handled by Supabase/Clerk.
 * This function is ready to use when a custom password reset flow is implemented.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  customerName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
}) {
  const html = passwordResetTemplate(params);
  const subject = "Reset Your Password";

  return sendEmail({
    channel: "support",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "password_reset" },
    ],
  });
}

/**
 * Send payout processed email to merchant
 */
export async function sendPayoutProcessedEmail(params: {
  to: string;
  merchantName: string;
  payoutId: string;
  amount: number;
  currency?: string;
  payoutDate?: string;
  bankLast4?: string;
  settlementRef?: string;
}) {
  const html = payoutProcessedTemplate(params);
  const subject = `Payout Processed - ${params.payoutId}`;

  return sendEmail({
    channel: "finance",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "payout_processed" },
      { name: "payout_id", value: params.payoutId },
    ],
  });
}

/**
 * Send commission summary email to merchant
 */
export async function sendCommissionSummaryEmail(params: {
  to: string;
  merchantName: string;
  periodLabel: string;
  totalOrders: number;
  grossSales: number;
  platformFees: number;
  currency?: string;
  downloadUrl?: string;
}) {
  const html = commissionSummaryTemplate(params);
  const subject = `Commission Summary - ${params.periodLabel}`;

  return sendEmail({
    channel: "finance",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "commission_summary" },
      { name: "period", value: params.periodLabel },
    ],
  });
}

/**
 * Send internal high-value order alert to ops team
 */
export async function sendOpsHighValueOrderAlert(params: {
  orderId: string;
  orderNumber: string; // Add required orderNumber field
  storeName: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  paymentMode?: string;
  createdAt?: string;
  adminUrl?: string;
}) {
  const opsEmail = process.env.OPS_ALERT_TO || "ops@merceton.com";
  const html = internalHighValueOrderTemplate(params);
  const subject = `High Value Order Alert - ${params.orderId}`;

  return sendEmail({
    channel: "ops",
    to: opsEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "ops_high_value_order" },
      { name: "order_id", value: params.orderId },
    ],
  });
}

/**
 * Send internal webhook failure alert to ops team
 */
export async function sendOpsWebhookFailureAlert(params: {
  eventName: string;
  endpoint?: string;
  errorMessage: string;
  occurredAt?: string;
  requestId?: string;
  adminUrl?: string;
}) {
  const opsEmail = process.env.OPS_ALERT_TO || "ops@merceton.com";
  const html = internalWebhookFailureTemplate(params);
  const subject = `Webhook Failure: ${params.eventName}`;

  return sendEmail({
    channel: "ops",
    to: opsEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "ops_webhook_failure" },
      { name: "event", value: params.eventName },
    ],
  });
}

/**
 * Send internal refund threshold alert to ops team
 */
export async function sendOpsRefundThresholdAlert(params: {
  periodLabel: string;
  refundCount: number;
  refundTotal: number;
  threshold: number;
  currency?: string;
  adminUrl?: string;
}) {
  const opsEmail = process.env.OPS_ALERT_TO || "ops@merceton.com";
  const html = internalRefundThresholdTemplate(params);
  const subject = `Refund Threshold Alert - ${params.periodLabel}`;

  return sendEmail({
    channel: "ops",
    to: opsEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "ops_refund_threshold" },
      { name: "period", value: params.periodLabel },
    ],
  });
}

/**
 * Send internal new merchant signup alert to ops team
 */
export async function sendOpsNewMerchantSignupAlert(params: {
  merchantName: string;
  merchantEmail: string;
  createdAt?: string;
  planName?: string;
  adminUrl?: string;
}) {
  const opsEmail = process.env.OPS_ALERT_TO || "ops@merceton.com";
  const html = internalNewMerchantSignupTemplate(params);
  const subject = `New Merchant Signup: ${params.merchantName}`;

  return sendEmail({
    channel: "ops",
    to: opsEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "ops_new_merchant" },
      { name: "merchant_email", value: params.merchantEmail },
    ],
  });
}

/**
 * Send new order notification email to merchant
 */
export async function sendNewOrderEmailToMerchant(params: {
  to: string;
  merchantName: string;
  orderId: string;
  orderNumber: string;
  orderDate?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  totalAmount: number;
  currency?: string;
  paymentMethod?: string;
  adminUrl?: string;
}) {
  const html = newOrderForMerchantTemplate(params);
  const orderDisplayId = params.orderNumber || params.orderId;
  const subject = `New Order Received - ${orderDisplayId}`;

  return sendEmail({
    channel: "orders",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "new_order_merchant" },
      { name: "order_id", value: params.orderId },
    ],
  });
}

/**
 * Send merchant account on hold notification email
 */
export async function sendMerchantOnHoldEmail(params: {
  to: string;
  merchantName: string;
  reasonCode: string;
  reasonText?: string | null;
}) {
  const html = accountOnHoldEmail({
    merchantName: params.merchantName,
    reasonCode: params.reasonCode,
    reasonText: params.reasonText,
  });
  const subject = "Action needed: Your Merceton account is on hold";

  return sendEmail({
    channel: "support",
    to: params.to,
    subject,
    html,
    replyTo: "support@merceton.com",
    tags: [
      { name: "type", value: "merchant_on_hold" },
      { name: "reason_code", value: params.reasonCode },
    ],
  });
}

/**
 * Send KYC approved notification email
 */
export async function sendMerchantKycApprovedEmail(params: {
  to: string;
  merchantName: string;
}) {
  const html = kycApprovedEmail({
    merchantName: params.merchantName,
  });
  const subject = "KYC approved: You're ready to sell on Merceton";

  return sendEmail({
    channel: "support",
    to: params.to,
    subject,
    html,
    replyTo: "support@merceton.com",
    tags: [
      { name: "type", value: "merchant_kyc_approved" },
    ],
  });
}

/**
 * Send hold released notification email
 */
export async function sendMerchantHoldReleasedEmail(params: {
  to: string;
  merchantName: string;
}) {
  const html = holdReleasedEmail({
    merchantName: params.merchantName,
  });
  const subject = "Your Merceton account is active again";

  return sendEmail({
    channel: "support",
    to: params.to,
    subject,
    html,
    replyTo: "support@merceton.com",
    tags: [
      { name: "type", value: "merchant_hold_released" },
    ],
  });
}

/**
 * Send email to internal team when a new ticket is created
 */
export async function sendTicketCreatedEmail(params: {
  ticketId: string
  ticketNumber: string
  merchantName: string
  subject: string
  message: string
  ticketUrl: string
}) {
  const html = ticketCreatedTemplate(params)
  const subject = `New Support Ticket: ${params.subject}`

  return sendEmail({
    channel: "support",
    to: process.env.SUPPORT_EMAIL_RECIPIENT || "support@merceton.com",
    subject,
    html,
    tags: [
      { name: "type", value: "ticket_created" },
      { name: "ticket_id", value: params.ticketId },
    ],
  })
}

/**
 * Send email to merchant when admin replies to ticket
 */
export async function sendTicketReplyToMerchant(params: {
  to: string
  ticketId: string
  ticketNumber: string
  subject: string
  replyMessage: string
  repliedBy: string
  ticketUrl: string
}) {
  const html = ticketReplyTemplate({
    ...params,
    isAdminReply: true,
  })
  const subject = `Re: ${params.subject} [Ticket #${params.ticketNumber}]`

  return sendEmail({
    channel: "support",
    to: params.to,
    subject,
    html,
    tags: [
      { name: "type", value: "ticket_reply_merchant" },
      { name: "ticket_id", value: params.ticketId },
    ],
  })
}

/**
 * Send email to internal team when merchant replies to ticket
 */
export async function sendTicketReplyToAdmin(params: {
  ticketId: string
  ticketNumber: string
  subject: string
  replyMessage: string
  merchantName: string
  ticketUrl: string
}) {
  const html = ticketReplyTemplate({
    ...params,
    repliedBy: params.merchantName,
    isAdminReply: false,
  })
  const subject = `Re: ${params.subject} [Ticket #${params.ticketNumber}]`

  return sendEmail({
    channel: "support",
    to: process.env.SUPPORT_EMAIL_RECIPIENT || "support@merceton.com",
    subject,
    html,
    tags: [
      { name: "type", value: "ticket_reply_admin" },
      { name: "ticket_id", value: params.ticketId },
    ],
  })
}
