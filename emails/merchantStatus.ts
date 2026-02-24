import { wrapEmail } from "./_layout"
import { getHoldReasonLabel } from "@/lib/merchant/holdReasons"

/**
 * Email template: Account on hold notification
 */
export function accountOnHoldEmail(params: {
  merchantName: string
  reasonCode: string
  reasonText?: string | null
  supportEmail?: string
  supportPhone?: string
  supportHours?: string
}): string {
  const {
    merchantName,
    reasonCode,
    reasonText,
    supportEmail = "info@smarkitalstech.com",
    supportPhone = "9289109004",
    supportHours = "Monday to Friday, 10 AM to 7 PM",
  } = params

  const reasonLabel = getHoldReasonLabel(reasonCode)
  const hasCustomNotes = reasonText && reasonText.trim().length > 0

  const bodyHtml = `
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Action Needed: Your Merceton Account is On Hold
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      Hello ${merchantName},
    </p>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      Your Merceton account has been placed on hold. This means certain actions in your dashboard are temporarily restricted while we review your account.
    </p>
    
    <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">
        Reason for Hold:
      </p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #7f1d1d;">
        ${reasonLabel}
      </p>
      ${hasCustomNotes ? `<p style="margin: 0; font-size: 14px; color: #7f1d1d;">${reasonText}</p>` : ""}
    </div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      <strong>What happens next?</strong>
    </p>
    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #374151;">
      <li>You can still view your dashboard, orders, and account information</li>
      <li>Creating new products, publishing products, and requesting payouts are temporarily disabled</li>
      <li>Please contact our support team to resolve this issue</li>
    </ul>
    
    <div style="margin: 24px 0; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
        Contact Support:
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #075985;">
        <strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #0284c7; text-decoration: none;">${supportEmail}</a>
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #075985;">
        <strong>Phone:</strong> ${supportPhone}
      </p>
      <p style="margin: 0; font-size: 14px; color: #075985;">
        <strong>Hours:</strong> ${supportHours}
      </p>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: #374151;">
      We're here to help you get back to selling. Please reach out to us at your earliest convenience.
    </p>
  `

  return wrapEmail({
    title: "Action needed: Your Merceton account is on hold",
    preheader: `Your account has been placed on hold: ${reasonLabel}`,
    bodyHtml,
    footerNote: "This is an automated notification. Please do not reply to this email.",
  })
}

/**
 * Email template: KYC approved notification
 */
export function kycApprovedEmail(params: {
  merchantName: string
  supportEmail?: string
  supportPhone?: string
  supportHours?: string
}): string {
  const {
    merchantName,
    supportEmail = "info@smarkitalstech.com",
    supportPhone = "9289109004",
    supportHours = "Monday to Friday, 10 AM to 7 PM",
  } = params

  const bodyHtml = `
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      KYC Approved: You're Ready to Sell on Merceton
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      Hello ${merchantName},
    </p>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      Great news! Your KYC (Know Your Customer) verification has been approved. Your account is now fully active and you can start selling on Merceton.
    </p>
    
    <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534;">
        ✓ Your account is verified and ready to use
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      You can now:
    </p>
    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #374151;">
      <li>Create and publish products</li>
      <li>Receive orders from customers</li>
      <li>Process payments and settlements</li>
      <li>Access all dashboard features</li>
    </ul>
    
    <div style="margin: 24px 0; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
        Need Help?
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #075985;">
        <strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #0284c7; text-decoration: none;">${supportEmail}</a>
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #075985;">
        <strong>Phone:</strong> ${supportPhone}
      </p>
      <p style="margin: 0; font-size: 14px; color: #075985;">
        <strong>Hours:</strong> ${supportHours}
      </p>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: #374151;">
      Welcome to Merceton! We're excited to have you on board.
    </p>
  `

  return wrapEmail({
    title: "KYC approved: You're ready to sell on Merceton",
    preheader: "Your KYC verification has been approved",
    bodyHtml,
    footerNote: "This is an automated notification. Please do not reply to this email.",
  })
}

/**
 * Email template: Hold released notification
 */
export function holdReleasedEmail(params: {
  merchantName: string
  supportEmail?: string
  supportPhone?: string
  supportHours?: string
}): string {
  const {
    merchantName,
    supportEmail = "info@smarkitalstech.com",
    supportPhone = "9289109004",
    supportHours = "Monday to Friday, 10 AM to 7 PM",
  } = params

  const bodyHtml = `
    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Your Merceton Account is Active Again
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      Hello ${merchantName},
    </p>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      Good news! The hold on your Merceton account has been released. Your account is now fully active and all features are available.
    </p>
    
    <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534;">
        ✓ Your account is active and all restrictions have been removed
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
      You can now:
    </p>
    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #374151;">
      <li>Create and publish products</li>
      <li>Request payouts and settlements</li>
      <li>Update payment settings</li>
      <li>Access all dashboard features</li>
    </ul>
    
    <div style="margin: 24px 0; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
        Questions?
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #075985;">
        <strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #0284c7; text-decoration: none;">${supportEmail}</a>
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #075985;">
        <strong>Phone:</strong> ${supportPhone}
      </p>
      <p style="margin: 0; font-size: 14px; color: #075985;">
        <strong>Hours:</strong> ${supportHours}
      </p>
    </div>
    
    <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: #374151;">
      Thank you for your patience. We're here to support your success on Merceton.
    </p>
  `

  return wrapEmail({
    title: "Your Merceton account is active again",
    preheader: "The hold on your account has been released",
    bodyHtml,
    footerNote: "This is an automated notification. Please do not reply to this email.",
  })
}
