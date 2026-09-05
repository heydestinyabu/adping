import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";

export class BrevoProvider extends BaseEmailProvider {
  readonly name = "Brevo (Sendinblue)";
  readonly providerType = "brevo";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: true,
    clickTracking: true,
    inboundEmail: true,
  };

  private apiKey: string;
  private baseUrl = "https://api.brevo.com/v3";

  constructor(config: { apiKey: string }) {
    super();
    this.apiKey = config.apiKey?.trim();
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const payload: any = {
        sender: { name: options.from.name, email: options.from.email },
        to: options.to.map((r) => ({ name: r.name, email: r.email })),
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        tags: options.tags,
        headers: options.headers || {},
      };

      if (options.messageId) payload.headers["Message-ID"] = options.messageId;
      if (options.inReplyTo) payload.headers["In-Reply-To"] = options.inReplyTo;
      if (options.references) payload.headers["References"] = options.references;

      const res = await fetch(`${this.baseUrl}/smtp/email`, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (!res.ok) {
        return { success: false, error: data?.message || `Brevo error ${res.status}` };
      }

      return { success: true, providerMessageId: data.messageId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      const res = await fetch(`${this.baseUrl}/account`, {
        headers: { "api-key": this.apiKey, "Accept": "application/json" },
      });
      const isSuccess = res.ok || res.status === 403 || res.status === 401;
      return { success: isSuccess, error: isSuccess ? undefined : `Status ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    if (!rawPayload?.event) return null;
    
    const typeMap: Record<string, ProviderEmailEvent["type"]> = {
      "delivered": "delivered",
      "opened": "opened",
      "click": "clicked",
      "hard_bounce": "bounced_hard",
      "soft_bounce": "bounced_soft",
      "spam": "complained",
      "unsubscribed": "unsubscribed",
    };

    const eventType = typeMap[rawPayload.event];
    if (!eventType) return null;

    return {
      type: eventType,
      providerMessageId: rawPayload.messageId || "",
      toEmail: rawPayload.email || "",
      clickedUrl: rawPayload.link,
      bounceType: eventType.includes("bounce") ? (rawPayload.event === "hard_bounce" ? "hard" : "soft") : undefined,
      bounceReason: rawPayload.reason,
      timestamp: new Date((rawPayload.date || rawPayload.ts || Math.floor(Date.now()/1000)) * 1000),
      rawPayload,
    };
  }
}
