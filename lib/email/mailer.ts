import { Resend } from "resend";

export type EmailChannel = "orders" | "support" | "finance" | "ops";

interface SendEmailParams {
  channel: EmailChannel;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
}

// Initialize Resend client once
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error(
    "RESEND_API_KEY environment variable is required. Please set it in your .env.local file."
  );
}

const resend = new Resend(apiKey);

/**
 * Get sender email address based on channel
 */
function getSenderFromChannel(channel: EmailChannel): string {
  const envVarMap: Record<EmailChannel, string> = {
    orders: process.env.EMAIL_FROM_ORDERS || "merceton Orders <no-reply@merceton.com>",
    support: process.env.EMAIL_FROM_SUPPORT || "Merceton Support <support@merceton.com>",
    finance: process.env.EMAIL_FROM_FINANCE || "Merceton Finance <billing@merceton.com>",
    ops: process.env.EMAIL_FROM_OPS || "Merceton Ops <ops@merceton.com>",
  };

  return envVarMap[channel];
}

/**
 * Get default reply-to address based on channel
 */
function getDefaultReplyTo(channel: EmailChannel, providedReplyTo?: string): string | undefined {
  if (providedReplyTo) {
    return providedReplyTo;
  }

  const defaultReplyToMap: Record<EmailChannel, string | undefined> = {
    orders: "support@merceton.com",
    support: "support@merceton.com",
    finance: "billing@merceton.com",
    ops: undefined, // No default reply-to for ops
  };

  return defaultReplyToMap[channel];
}

/**
 * Send transactional email via Resend
 * 
 * @param params Email parameters including channel, recipient, subject, and HTML content
 * @returns Resend API response
 */
export async function sendEmail(params: SendEmailParams) {
  const { channel, to, subject, html, replyTo, cc, bcc, tags, headers } = params;

  const from = getSenderFromChannel(channel);
  const defaultReplyTo = getDefaultReplyTo(channel, replyTo);

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: defaultReplyTo,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      tags: tags?.map((tag) => ({ name: tag.name, value: tag.value })),
      headers,
    });

    return result;
  } catch (error: any) {
    // Log structured error payload for debugging
    console.error("[email:sendEmail] Failed to send email", {
      channel,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      error: error.message || String(error),
      errorCode: error.code,
    });

    // Re-throw to allow caller to handle
    throw error;
  }
}
