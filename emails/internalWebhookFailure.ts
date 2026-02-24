import { wrapEmail } from "./_layout";

interface InternalWebhookFailureParams {
  eventName: string;
  endpoint?: string;
  errorMessage: string;
  occurredAt?: string;
  requestId?: string;
  adminUrl?: string;
}

export function internalWebhookFailureTemplate(params: InternalWebhookFailureParams): string {
  const {
    eventName,
    endpoint,
    errorMessage,
    occurredAt,
    requestId,
    adminUrl,
  } = params;

  const formattedDate = occurredAt || new Date().toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  let adminLink = "";
  if (adminUrl) {
    adminLink = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          View Details in Admin
        </a>
      </div>
    `;
  }

  const bodyHtml = `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 0 0 20px; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px; color: #991b1b; font-weight: 600;">
        🚨 Webhook Failure Alert
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      A webhook delivery has failed and requires attention.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Event Name</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${eventName}</p>
          </td>
        </tr>
        ${endpoint ? `
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Endpoint</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937; font-family: monospace; word-break: break-all;">${endpoint}</p>
            </td>
          </tr>
        ` : ""}
        ${requestId ? `
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Request ID</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937; font-family: monospace;">${requestId}</p>
            </td>
          </tr>
        ` : ""}
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Occurred At</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937;">${formattedDate}</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #1f2937; border-radius: 4px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Error Message</p>
      <pre style="margin: 0; font-size: 13px; color: #f3f4f6; font-family: 'Courier New', monospace; white-space: pre-wrap; word-break: break-word; line-height: 1.5;">${errorMessage}</pre>
    </div>

    ${adminLink}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Please investigate and resolve this webhook failure promptly.
    </p>
  `;

  return wrapEmail({
    title: "Webhook Failure Alert",
    preheader: `Webhook failure: ${eventName}`,
    bodyHtml,
    footerNote: "This is an internal alert email.",
  });
}
