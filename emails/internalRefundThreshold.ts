import { wrapEmail } from "./_layout";

interface InternalRefundThresholdParams {
  periodLabel: string;
  refundCount: number;
  refundTotal: number;
  threshold: number;
  currency?: string;
  adminUrl?: string;
}

export function internalRefundThresholdTemplate(params: InternalRefundThresholdParams): string {
  const {
    periodLabel,
    refundCount,
    refundTotal,
    threshold,
    currency = "₹",
    adminUrl,
  } = params;

  const formattedRefundTotal = `${currency} ${refundTotal.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedThreshold = `${currency} ${threshold.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  let adminLink = "";
  if (adminUrl) {
    adminLink = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          View Refunds Dashboard
        </a>
      </div>
    `;
  }

  const bodyHtml = `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 0 0 20px; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 600;">
        ⚠️ Refund Threshold Alert
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Refund activity has exceeded the configured threshold for ${periodLabel}.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Period</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${periodLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Refund Count</p>
            <p style="margin: 4px 0 0; font-size: 18px; color: #dc2626; font-weight: 700;">${refundCount}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Refund Total</p>
            <p style="margin: 4px 0 0; font-size: 20px; color: #dc2626; font-weight: 700;">${formattedRefundTotal}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Threshold</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${formattedThreshold}</p>
          </td>
        </tr>
      </table>
    </div>

    ${adminLink}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Please review refund patterns and take appropriate action if needed.
    </p>
  `;

  return wrapEmail({
    title: "Refund Threshold Alert",
    preheader: `Refund threshold exceeded: ${formattedRefundTotal}`,
    bodyHtml,
    footerNote: "This is an internal alert email.",
  });
}
