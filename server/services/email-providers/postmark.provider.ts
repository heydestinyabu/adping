import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";

export class PostmarkProvider extends BaseEmailProvider {
  readonly name = "Postmark";
  readonly providerType = "postmark";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: true,
    clickTracking: true,
    inboundEmail: true,
  };

  private serverToken: string;
  private baseUrl = "https://api.postmarkapp.com";

  constructor(config: { serverToken: string }) {
    super();
    this.serverToken = config.serverToken?.trim();
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const payload: any = {
        From: `${options.from.name} <${options.from.email}>`,
        To: options.to.map((r) => r.name ? `${r.name} <${r.email}>` : r.email).join(","),
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text,
        ReplyTo: options.replyTo,
        TrackOpens: true,
        TrackLinks: "HtmlAndText",
        Headers: [],
      };

      if (options.messageId) payload.Headers.push({ Name: "Message-ID", Value: options.messageId });
      if (options.inReplyTo) payload.Headers.push({ Name: "In-Reply-To", Value: options.inReplyTo });
      if (options.references) payload.Headers.push({ Name: "References", Value: options.references });
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => payload.Headers.push({ Name: k, Value: v }));
      }
      
      // Postmark uses MessageStream for categories/tags, but we can also set metadata
      if (options.tags && options.tags.length > 0) {
        payload.Metadata = { tags: options.tags.join(",") };
      }

      const res = await fetch(`${this.baseUrl}/email`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": this.serverToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({})) as any;

      if (!res.ok) {
        return { success: false, error: data?.Message || `Postmark error ${res.status}` };
      }

      return { success: true, providerMessageId: data.MessageID };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      // Get server info to verify token
      const res = await fetch(`${this.baseUrl}/server`, {
        headers: {
          "Accept": "application/json",
          "X-Postmark-Server-Token": this.serverToken,
        },
      });
      const isSuccess = res.ok || res.status === 403 || res.status === 401;
      return { success: isSuccess, error: isSuccess ? undefined : `Status ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    if (!rawPayload?.RecordType) return null;
    
    const typeMap: Record<string, ProviderEmailEvent["type"]> = {
      "Delivery": "delivered",
      "Open": "opened",
      "Click": "clicked",
      "Bounce": "bounced_hard", // Can be hard or soft, handled below
      "SpamComplaint": "complained",
      "SubscriptionChange": "unsubscribed", // if SuppressSending is true
    };

    let eventType = typeMap[rawPayload.RecordType];
    if (!eventType) return null;

    let bounceType, bounceReason;
    if (eventType === "bounced_hard") {
      // Postmark Bounce type. Type="HardBounce" or "SoftBounce" etc
      bounceType = rawPayload.Type === "HardBounce" ? "hard" : "soft";
      eventType = bounceType === "soft" ? "bounced_soft" : "bounced_hard";
      bounceReason = rawPayload.Description || rawPayload.Details;
    }

    if (rawPayload.RecordType === "SubscriptionChange" && !rawPayload.SuppressSending) {
      // It's a resubscribe, not an unsubscribe. We don't have an event for this currently.
      return null;
    }

    return {
      type: eventType,
      providerMessageId: rawPayload.MessageID || "",
      toEmail: rawPayload.Recipient || rawPayload.Email || "",
      clickedUrl: rawPayload.OriginalLink,
      bounceType: bounceType as any,
      bounceReason,
      timestamp: new Date(rawPayload.DeliveredAt || rawPayload.ReceivedAt || rawPayload.BouncedAt || rawPayload.ChangedAt || Date.now()),
      rawPayload,
    };
  }
}
