import { wrapEmail } from "./_layout";

interface InternalHighValueOrderParams {
  orderId: string; // Can be orderNumber for display or internal ID
  storeName: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  paymentMode?: string;
  createdAt?: string;
  adminUrl?: string;
}

export function internalHighValueOrderTemplate(params: InternalHighValueOrderParams): string {
  const {
    orderId,
    storeName,
    amount,
    currency = "₹",
    customerEmail,
    paymentMode,
    createdAt,
    adminUrl,
  } = params;

  const formattedAmount = `${currency} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedDate = createdAt || new Date().toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let adminLink = "";
  if (adminUrl) {
    adminLink = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          View Order in Admin
        </a>
      </div>
    `;
  }

  const bodyHtml = `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 0 0 20px; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 600;">
        ⚠️ High Value Order Alert
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      A high-value order has been placed and requires attention.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Order ID</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600; font-family: monospace;">${orderId}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Store</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${storeName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Order Amount</p>
            <p style="margin: 4px 0 0; font-size: 20px; color: #dc2626; font-weight: 700;">${formattedAmount}</p>
          </td>
        </tr>
        ${customerEmail ? `
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Customer Email</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937;">${customerEmail}</p>
            </td>
          </tr>
        ` : ""}
        ${paymentMode ? `
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Payment Mode</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937;">${paymentMode}</p>
            </td>
          </tr>
        ` : ""}
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Created At</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937;">${formattedDate}</p>
          </td>
        </tr>
      </table>
    </div>

    ${adminLink}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Please review this order and ensure proper handling.
    </p>
  `;

  return wrapEmail({
    title: "High Value Order Alert",
    preheader: `High-value order ${orderId} - ${formattedAmount}`,
    bodyHtml,
    footerNote: "This is an internal alert email.",
  });
}
