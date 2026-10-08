import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
} from "./base.provider";

export class SendGridProvider extends BaseEmailProvider {
  readonly name = "SendGrid";
  readonly providerType = "sendgrid";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: false,
    bounceWebhooks: false,
    openTracking: false,
    clickTracking: false,
    inboundEmail: false,
  };

  async send(): Promise<SendResult> {
    return { success: false, error: "SendGrid is disabled in lightweight mode." };
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    return { success: false, error: "SendGrid disabled" };
  }
}
