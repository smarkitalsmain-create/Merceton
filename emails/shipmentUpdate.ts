import { wrapEmail } from "./_layout";

interface ShipmentUpdateParams {
  customerName: string;
  orderId: string; // Internal ID (for tracking)
  orderNumber: string; // Human-readable order number (for display)
  carrier?: string;
  trackingId?: string;
  trackingUrl?: string;
  eta?: string;
  storeName?: string;
}

export function shipmentUpdateTemplate(params: ShipmentUpdateParams): string {
  const {
    customerName,
    orderNumber, // Use orderNumber for customer-facing display
    carrier,
    trackingId,
    trackingUrl,
    eta,
    storeName,
  } = params;

  let trackingSection = "";
  if (trackingId || trackingUrl) {
    trackingSection = `
      <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
        ${trackingId ? `
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Tracking ID</p>
          <p style="margin: 0 0 12px; font-size: 16px; color: #1f2937; font-weight: 600; font-family: monospace;">${trackingId}</p>
        ` : ""}
        ${carrier ? `
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Carrier</p>
          <p style="margin: 0 0 12px; font-size: 14px; color: #1f2937;">${carrier}</p>
        ` : ""}
        ${eta ? `
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Estimated Delivery</p>
          <p style="margin: 0; font-size: 14px; color: #1f2937;">${eta}</p>
        ` : ""}
      </div>
    `;

    if (trackingUrl) {
      trackingSection += `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
            Track Your Package
          </a>
        </div>
      `;
    }
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Great news! Your order${storeName ? ` from ${storeName}` : ""} has been shipped.
    </p>

    <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Order Number</p>
      <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 600; font-family: monospace;">${orderNumber}</p>
    </div>

    ${trackingSection}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      We'll notify you once your package is out for delivery.
    </p>
  `;

  return wrapEmail({
    title: "Your Order Has Shipped",
    preheader: `Your order ${orderNumber} is on the way`,
    bodyHtml,
  });
}
