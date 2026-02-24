import { wrapEmail } from "./_layout";

interface PasswordResetParams {
  customerName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function passwordResetTemplate(params: PasswordResetParams): string {
  const { customerName, resetUrl, expiresInMinutes = 30 } = params;

  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      ${greeting}
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Reset Password
      </a>
    </div>

    <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 12px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; font-weight: 600;">Or copy and paste this link:</p>
      <p style="margin: 0; font-size: 12px; color: #1f2937; font-family: monospace; word-break: break-all; line-height: 1.5;">
        ${resetUrl}
      </p>
    </div>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #991b1b; font-weight: 600;">Security Note</p>
      <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
        This link will expire in ${expiresInMinutes} minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.
      </p>
    </div>
  `;

  return wrapEmail({
    title: "Reset Your Password",
    preheader: "Click the link to reset your password",
    bodyHtml,
  });
}
