import { wrapEmail } from "./_layout";

interface OrderConfirmationParams {
  customerName: string;
  orderId: string; // Internal ID (for tracking)
  orderNumber: string; // Human-readable order number (for display)
  orderDate?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  totalAmount: number;
  currency?: string;
  storeName?: string;
}

export function orderConfirmationTemplate(params: OrderConfirmationParams): string {
  const {
    customerName,
    orderNumber, // Use orderNumber for customer-facing display
    orderDate,
    items = [],
    totalAmount,
    currency = "₹",
    storeName,
  } = params;

  const formattedDate = orderDate || new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedAmount = `${currency} ${totalAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  let itemsHtml = "";
  if (items.length > 0) {
    itemsHtml = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #374151;">Item</th>
            <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #374151;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #374151;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-size: 14px; color: #1f2937;">${item.name}</td>
              <td style="padding: 12px; text-align: center; font-size: 14px; color: #1f2937;">${item.qty}</td>
              <td style="padding: 12px; text-align: right; font-size: 14px; color: #1f2937;">${currency} ${item.price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Your order has been confirmed!${storeName ? ` Thank you for shopping with ${storeName}.` : ""}
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Order Number</p>
      <p style="margin: 0 0 12px; font-size: 18px; color: #1f2937; font-weight: 600; font-family: monospace;">${orderNumber}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Order Date</p>
      <p style="margin: 0; font-size: 14px; color: #1f2937;">${formattedDate}</p>
    </div>

    ${itemsHtml}

    <div style="margin: 24px 0; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: right;">
            <p style="margin: 0 0 8px; font-size: 16px; color: #6b7280;">Total Amount</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">${formattedAmount}</p>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      You can reply to this email for support.
    </p>
  `;

  return wrapEmail({
    title: "Order Confirmation",
    preheader: `Your order ${orderNumber} has been confirmed`,
    bodyHtml,
  });
}
