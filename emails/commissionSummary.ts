import { wrapEmail } from "./_layout";

interface CommissionSummaryParams {
  merchantName: string;
  periodLabel: string;
  totalOrders: number;
  grossSales: number;
  platformFees: number;
  currency?: string;
  downloadUrl?: string;
}

export function commissionSummaryTemplate(params: CommissionSummaryParams): string {
  const {
    merchantName,
    periodLabel,
    totalOrders,
    grossSales,
    platformFees,
    currency = "₹",
    downloadUrl,
  } = params;

  const formattedGrossSales = `${currency} ${grossSales.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedPlatformFees = `${currency} ${platformFees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const netAmount = grossSales - platformFees;
  const formattedNetAmount = `${currency} ${netAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  let downloadSection = "";
  if (downloadUrl) {
    downloadSection = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Download Detailed Report
        </a>
      </div>
    `;
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Hi ${merchantName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Here's your commission summary for ${periodLabel}.
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
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Total Orders</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${totalOrders}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Gross Sales</p>
            <p style="margin: 4px 0 0; font-size: 18px; color: #1f2937; font-weight: 700;">${formattedGrossSales}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Platform Fees</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #dc2626; font-weight: 600;">- ${formattedPlatformFees}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0 0; border-top: 2px solid #1f2937;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280; font-weight: 600;">Net Amount</p>
            <p style="margin: 4px 0 0; font-size: 20px; color: #10b981; font-weight: 700;">${formattedNetAmount}</p>
          </td>
        </tr>
      </table>
    </div>

    ${downloadSection}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      This amount will be included in your next payout cycle.
    </p>
  `;

  return wrapEmail({
    title: `Commission Summary - ${periodLabel}`,
    preheader: `Your ${periodLabel} commission summary is ready`,
    bodyHtml,
  });
}
