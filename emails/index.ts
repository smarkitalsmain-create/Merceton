/**
 * Merceton Email Templates
 * 
 * Barrel export for all transactional email templates.
 * Import templates from this file for consistent usage.
 */

export { orderConfirmationTemplate } from "./orderConfirmation";
export { shipmentUpdateTemplate } from "./shipmentUpdate";
export { refundInitiatedTemplate } from "./refundInitiated";
export { passwordResetTemplate } from "./passwordReset";
export { payoutProcessedTemplate } from "./payoutProcessed";
export { commissionSummaryTemplate } from "./commissionSummary";
export { internalHighValueOrderTemplate } from "./internalHighValueOrder";
export { internalWebhookFailureTemplate } from "./internalWebhookFailure";
export { internalRefundThresholdTemplate } from "./internalRefundThreshold";
export { internalNewMerchantSignupTemplate } from "./internalNewMerchantSignup";
export { newOrderForMerchantTemplate } from "./newOrderForMerchant";
export { accountOnHoldEmail, kycApprovedEmail, holdReleasedEmail } from "./merchantStatus";
export { ticketCreatedTemplate } from "./ticketCreated";
export { ticketReplyTemplate } from "./ticketReply";
