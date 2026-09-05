import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";

export class SparkPostProvider extends BaseEmailProvider {
  readonly name = "SparkPost";
  readonly providerType = "sparkpost";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: true,
    clickTracking: true,
    inboundEmail: true,
  };

  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; region?: string }) {
    super();
    this.apiKey = config.apiKey?.trim();
    this.baseUrl = config.region === "eu" 
      ? "https://api.eu.sparkpost.com/api/v1"
      : "https://api.sparkpost.com/api/v1";
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const payload: any = {
        options: {
          open_tracking: true,
          click_tracking: true,
        },
        content: {
          from: { name: options.from.name, email: options.from.email },
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
          headers: options.headers || {},
        },
        recipients: options.to.map((r) => ({
          address: { name: r.name, email: r.email }
        })),
      };

      if (options.messageId) payload.content.headers["Message-ID"] = options.messageId;
      if (options.inReplyTo) payload.content.headers["In-Reply-To"] = options.inReplyTo;
      if (options.references) payload.content.headers["References"] = options.references;

      if (options.tags && options.tags.length > 0) {
        payload.campaign_id = options.tags[0]; // Sparkpost mainly uses campaign_id for aggregate tagging
      }

      const res = await fetch(`${this.baseUrl}/transmissions`, {
        method: "POST",
        headers: {
          "Authorization": this.apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (!res.ok) {
        return { success: false, error: data?.errors?.[0]?.message || `SparkPost error ${res.status}` };
      }

      return { success: true, providerMessageId: data.results?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      // Calling GET /sending-domains as a lightweight auth check
      const res = await fetch(`${this.baseUrl}/sending-domains`, {
        headers: { "Authorization": this.apiKey },
      });
      const isSuccess = res.ok || res.status === 403 || res.status === 401;
      return { success: isSuccess, error: isSuccess ? undefined : `Status ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    // Sparkpost sends an array of events
    const eventWrapper = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
    if (!eventWrapper?.msys) return null;

    // msys can contain message_event, track_event, etc.
    const eventCategory = Object.keys(eventWrapper.msys)[0];
    const event = eventWrapper.msys[eventCategory];
    if (!event || !event.type) return null;

    const typeMap: Record<string, ProviderEmailEvent["type"]> = {
      "delivery": "delivered",
      "open": "opened",
      "click": "clicked",
      "bounce": "bounced_hard", // could be soft
      "spam_complaint": "complained",
      "list_unsubscribe": "unsubscribed",
      "link_unsubscribe": "unsubscribed",
    };

    let eventType = typeMap[event.type];
    if (!eventType) return null;

    let bounceType, bounceReason;
    if (eventType === "bounced_hard") {
      bounceType = event.bounce_class >= 10 && event.bounce_class < 30 ? "hard" : "soft";
      eventType = bounceType === "soft" ? "bounced_soft" : "bounced_hard";
      bounceReason = event.raw_reason || event.reason;
    }

    return {
      type: eventType,
      providerMessageId: event.transmission_id || event.message_id || "",
      toEmail: event.rcpt_to || "",
      clickedUrl: event.target_link_url,
      bounceType: bounceType as any,
      bounceReason,
      timestamp: new Date((event.timestamp || Math.floor(Date.now()/1000)) * 1000),
      rawPayload,
    };
  }
}
