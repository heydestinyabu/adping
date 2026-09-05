import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";
import sgMail from "@sendgrid/mail";

export class SendGridProvider extends BaseEmailProvider {
  readonly name = "SendGrid";
  readonly providerType = "sendgrid";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: true,
    clickTracking: true,
    inboundEmail: true, // SendGrid supports Inbound Parse
  };

  private apiKey: string;

  constructor(config: { apiKey: string }) {
    super();
    this.apiKey = config.apiKey?.trim();
    sgMail.setApiKey(this.apiKey);
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const msg: any = {
        to: options.to.map((r) => ({ name: r.name, email: r.email })),
        from: { name: options.from.name, email: options.from.email },
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
        headers: options.headers || {},
        customArgs: options.tags ? { tags: options.tags.join(",") } : {},
      };

      if (options.messageId) msg.headers["Message-ID"] = options.messageId;
      if (options.inReplyTo) msg.headers["In-Reply-To"] = options.inReplyTo;
      if (options.references) msg.headers["References"] = options.references;

      const [response] = await sgMail.send(msg);
      
      const messageId = response.headers['x-message-id'];
      
      return { success: true, providerMessageId: messageId };
    } catch (err: any) {
      const errorMsg = err.response?.body?.errors?.[0]?.message || err.message;
      return { success: false, error: errorMsg };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      // SendGrid doesn't have a simple ping, so we check scopes or a simple non-sending API
      const res = await fetch("https://api.sendgrid.com/v3/scopes", {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      // 403 means the key is valid but restricted (e.g. sending only), which is fine.
      const isSuccess = res.ok || res.status === 403;
      return { success: isSuccess, error: isSuccess ? undefined : `Status ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    if (!rawPayload?.event) return null;
    
    const typeMap: Record<string, ProviderEmailEvent["type"]> = {
      "delivered": "delivered",
      "open": "opened",
      "click": "clicked",
      "bounce": "bounced_hard",
      "dropped": "bounced_hard",
      "spamreport": "complained",
      "unsubscribe": "unsubscribed",
    };

    const eventType = typeMap[rawPayload.event];
    if (!eventType) return null;

    return {
      type: eventType,
      providerMessageId: rawPayload.sg_message_id?.split('.')[0] || "",
      toEmail: rawPayload.email || "",
      clickedUrl: rawPayload.url,
      bounceType: rawPayload.event === "bounce" ? "hard" : undefined,
      bounceReason: rawPayload.reason,
      timestamp: new Date((rawPayload.timestamp || Math.floor(Date.now()/1000)) * 1000),
      rawPayload,
    };
  }
}
