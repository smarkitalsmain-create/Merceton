import { wrapEmail } from "./_layout";

interface InternalNewMerchantSignupParams {
  merchantName: string;
  merchantEmail: string;
  createdAt?: string;
  planName?: string;
  adminUrl?: string;
}

export function internalNewMerchantSignupTemplate(params: InternalNewMerchantSignupParams): string {
  const {
    merchantName,
    merchantEmail,
    createdAt,
    planName,
    adminUrl,
  } = params;

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
          View Merchant in Admin
        </a>
      </div>
    `;
  }

  const bodyHtml = `
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 0 0 20px; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px; color: #166534; font-weight: 600;">
        ✨ New Merchant Signup
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      A new merchant has signed up and requires onboarding review.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Merchant Name</p>
            <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${merchantName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Email</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937;">${merchantEmail}</p>
          </td>
        </tr>
        ${planName ? `
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Plan</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937; font-weight: 600;">${planName}</p>
            </td>
          </tr>
        ` : ""}
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Signed Up At</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #1f2937;">${formattedDate}</p>
          </td>
        </tr>
      </table>
    </div>

    ${adminLink}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Please ensure the merchant completes onboarding and verify their account setup.
    </p>
  `;

  return wrapEmail({
    title: "New Merchant Signup",
    preheader: `New merchant: ${merchantName}`,
    bodyHtml,
    footerNote: "This is an internal alert email.",
  });
}
