import { wrapEmail } from "./_layout";

interface RefundInitiatedParams {
  customerName: string;
  orderId: string; // Internal ID (for tracking)
  orderNumber: string; // Human-readable order number (for display)
  refundAmount: number;
  currency?: string;
  refundMode?: string;
  expectedTimeline?: string;
  storeName?: string;
}

export function refundInitiatedTemplate(params: RefundInitiatedParams): string {
  const {
    customerName,
    orderNumber, // Use orderNumber for customer-facing display
    refundAmount,
    currency = "₹",
    refundMode,
    expectedTimeline,
    storeName,
  } = params;

  const formattedAmount = `${currency} ${refundAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      We've initiated a refund for your order${storeName ? ` from ${storeName}` : ""}.
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Order Number</p>
      <p style="margin: 0 0 16px; font-size: 16px; color: #1f2937; font-weight: 600; font-family: monospace;">${orderNumber}</p>
      
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Refund Amount</p>
      <p style="margin: 0; font-size: 20px; color: #1f2937; font-weight: 700;">${formattedAmount}</p>
    </div>

    ${refundMode ? `
      <p style="margin: 20px 0 8px; font-size: 14px; color: #6b7280;">Refund Method</p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #1f2937;">${refundMode}</p>
    ` : ""}

    ${expectedTimeline ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
          <strong>Expected Timeline:</strong> ${expectedTimeline}
        </p>
      </div>
    ` : ""}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      The refund will be processed according to your payment method. If you have any questions, please reply to this email.
    </p>
  `;

  return wrapEmail({
    title: "Refund Initiated",
    preheader: `Refund of ${formattedAmount} initiated for order ${orderNumber}`,
    bodyHtml,
  });
}
