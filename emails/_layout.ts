/**
 * Shared email layout wrapper for all Merceton transactional emails.
 * Provides consistent structure, styling, and branding.
 */

interface WrapEmailParams {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerNote?: string;
}

export function wrapEmail({
  title,
  preheader,
  bodyHtml,
  footerNote,
}: WrapEmailParams): string {
  const preheaderText = preheader || title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader text (hidden) -->
  <div style="display: none; font-size: 1px; color: #f5f5f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheaderText}
  </div>

  <!-- Email wrapper table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main content card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">
                Merceton
              </h1>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 30px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
              ${footerNote ? `<p style="margin: 0 0 12px; font-size: 13px; color: #666666; line-height: 1.5;">${footerNote}</p>` : ''}
              <p style="margin: 0 0 8px; font-size: 13px; color: #666666; line-height: 1.5;">
                Need help? <a href="mailto:support@merceton.com" style="color: #2563eb; text-decoration: none;">support@merceton.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Merceton
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
