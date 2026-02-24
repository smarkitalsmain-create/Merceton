import { wrapEmail } from "./_layout";

interface PayoutProcessedParams {
  merchantName: string;
  payoutId: string;
  amount: number;
  currency?: string;
  payoutDate?: string;
  bankLast4?: string;
  settlementRef?: string;
}

export function payoutProcessedTemplate(params: PayoutProcessedParams): string {
  const {
    merchantName,
    payoutId,
    amount,
    currency = "₹",
    payoutDate,
    bankLast4,
    settlementRef,
  } = params;

  const formattedAmount = `${currency} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedDate = payoutDate || new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bodyHtml = `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Hi ${merchantName},
    </p>
    
    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
      Your payout has been successfully processed and transferred to your bank account.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Payout Amount</p>
      <p style="margin: 0 0 16px; font-size: 24px; color: #1f2937; font-weight: 700;">${formattedAmount}</p>
      
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Payout ID</p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #1f2937; font-weight: 600; font-family: monospace;">${payoutId}</p>
      
      <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Processed Date</p>
      <p style="margin: 0; font-size: 14px; color: #1f2937;">${formattedDate}</p>
    </div>

    ${bankLast4 ? `
      <p style="margin: 20px 0 8px; font-size: 14px; color: #6b7280;">Bank Account</p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #1f2937;">****${bankLast4}</p>
    ` : ""}

    ${settlementRef ? `
      <div style="background-color: #f9fafb; padding: 12px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">Settlement Reference</p>
        <p style="margin: 0; font-size: 14px; color: #1f2937; font-family: monospace;">${settlementRef}</p>
      </div>
    ` : ""}

    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      The funds should appear in your bank account within 1-2 business days, depending on your bank's processing time.
    </p>
  `;

  return wrapEmail({
    title: "Payout Processed",
    preheader: `Payout of ${formattedAmount} has been processed`,
    bodyHtml,
  });
}
