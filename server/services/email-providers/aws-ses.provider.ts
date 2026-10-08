import {
  BaseEmailProvider,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
} from "./base.provider";

export class AwsSesProvider extends BaseEmailProvider {
  readonly name = "AWS SES";
  readonly providerType = "aws_ses";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: false,
    bounceWebhooks: false,
    openTracking: false,
    clickTracking: false,
    inboundEmail: false,
  };

  async send(): Promise<SendResult> {
    return { success: false, error: "AWS SES disabled in lightweight mode." };
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    return { success: false, error: "AWS SES disabled" };
  }
}
