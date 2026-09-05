import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";
import { SESClient, SendRawEmailCommand, GetSendQuotaCommand } from "@aws-sdk/client-ses";
import * as nodemailer from "nodemailer";

export class AwsSesProvider extends BaseEmailProvider {
  readonly name = "AWS SES";
  readonly providerType = "aws_ses";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: false, // SES doesn't natively do this without CloudWatch/SNS setup
    clickTracking: false,
    inboundEmail: true,
  };

  private client: SESClient;
  private transporter: nodemailer.Transporter;

  constructor(config: { accessKeyId: string; secretAccessKey: string; region: string }) {
    super();
    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    
    // We use nodemailer to build the raw MIME message easily
    this.transporter = nodemailer.createTransport({
      SES: { ses: this.client, aws: { SendRawEmailCommand } }
    });
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `${options.from.name} <${options.from.email}>`,
        to: options.to.map((r) => r.name ? `${r.name} <${r.email}>` : r.email).join(", "),
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        messageId: options.messageId,
        inReplyTo: options.inReplyTo,
        references: options.references,
        headers: options.headers,
      };

      if (options.tags && options.tags.length > 0) {
        mailOptions.headers = {
          ...mailOptions.headers,
          "X-SES-MESSAGE-TAGS": options.tags.map(t => `category=${t}`).join(", ")
        };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, providerMessageId: result.messageId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      const command = new GetSendQuotaCommand({});
      await this.client.send(command);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    // AWS SES sends events via SNS. This assumes the payload is the parsed SNS message.
    if (!rawPayload?.eventType) return null;
    
    const typeMap: Record<string, ProviderEmailEvent["type"]> = {
      "Delivery": "delivered",
      "Open": "opened",
      "Click": "clicked",
      "Bounce": "bounced_hard",
      "Complaint": "complained",
    };

    const eventType = typeMap[rawPayload.eventType];
    if (!eventType) return null;

    let bounceType, bounceReason;
    if (eventType === "bounced_hard") {
      bounceType = rawPayload.bounce?.bounceType === "Permanent" ? "hard" : "soft";
      bounceReason = rawPayload.bounce?.bouncedRecipients?.[0]?.diagnosticCode;
    }

    return {
      type: eventType === "bounced_hard" && bounceType === "soft" ? "bounced_soft" : eventType,
      providerMessageId: rawPayload.mail?.messageId || "",
      toEmail: rawPayload.mail?.destination?.[0] || "",
      clickedUrl: rawPayload.click?.link,
      bounceType: bounceType as any,
      bounceReason,
      timestamp: new Date(rawPayload.mail?.timestamp || Date.now()),
      rawPayload,
    };
  }
}
