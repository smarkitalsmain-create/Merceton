import { wrapEmail } from "./_layout";

interface NewOrderForMerchantParams {
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
}

export function newOrderForMerchantTemplate(params: NewOrderForMerchantParams): string {
  const {
    merchantName,
    orderId,
    orderNumber,
    orderDate,
    customerName,
    customerEmail,
    customerPhone,
    items = [],
    totalAmount,
    currency = "₹",
    paymentMethod,
    adminUrl,
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

  const customerInfoHtml = `
    <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Customer Details</p>
      <p style="margin: 4px 0; font-size: 14px; color: #1f2937;">${customerName}</p>
      ${customerEmail ? `<p style="margin: 4px 0; font-size: 14px; color: #1f2937;">${customerEmail}</p>` : ""}
      ${customerPhone ? `<p style="margin: 4px 0; font-size: 14px; color: #1f2937;">${customerPhone}</p>` : ""}
    </div>
  `;

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Hi ${merchantName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      You have received a new order!
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Order ID</p>
      <p style="margin: 0 0 12px; font-size: 18px; color: #1f2937; font-weight: 600; font-family: monospace;">${orderNumber}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Order Date</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #1f2937;">${formattedDate}</p>
      ${paymentMethod ? `<p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Payment Method</p><p style="margin: 0; font-size: 14px; color: #1f2937;">${paymentMethod}</p>` : ""}
    </div>

    ${customerInfoHtml}

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

    ${adminUrl ? `
      <div style="margin: 24px 0; text-align: center;">
        <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View Order in Dashboard</a>
      </div>
    ` : ""}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Please process this order as soon as possible.
    </p>
  `;

  return wrapEmail({
    title: "New Order Received",
    preheader: `New order ${orderNumber} received`,
    bodyHtml,
  });
}
