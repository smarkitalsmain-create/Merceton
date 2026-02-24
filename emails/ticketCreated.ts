export function ticketCreatedTemplate(params: {
  ticketId: string
  ticketNumber: string
  merchantName: string
  subject: string
  message: string
  ticketUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #1a1a1a;">New Support Ticket Created</h2>
  </div>

  <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <p><strong>Ticket #${params.ticketNumber}</strong></p>
    <p><strong>Merchant:</strong> ${params.merchantName}</p>
    <p><strong>Subject:</strong> ${params.subject}</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Message:</strong></p>
      <p style="margin-top: 10px; white-space: pre-wrap;">${params.message}</p>
    </div>

    <div style="margin-top: 30px;">
      <a href="${params.ticketUrl}" style="display: inline-block; background: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Ticket</a>
    </div>
  </div>

  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
    <p>This is an automated notification from Merceton Support System.</p>
  </div>
</body>
</html>
  `
}
