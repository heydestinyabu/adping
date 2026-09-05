import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";

export class MailgunProvider extends BaseEmailProvider {
  readonly name = "Mailgun";
  readonly providerType = "mailgun";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: true,
    clickTracking: true,
    inboundEmail: true,
  };

  private apiKey: string;
  private domain: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; domain: string; region?: string }) {
    super();
    this.domain = config.domain?.trim();
    this.apiKey = config.apiKey?.trim();
    const baseUrl = config.region === "eu" 
      ? `https://api.eu.mailgun.net/v3/${this.domain}`
      : `https://api.mailgun.net/v3/${this.domain}`;
    this.baseUrl = baseUrl;
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const formData = new URLSearchParams();
      formData.append("from", `${options.from.name} <${options.from.email}>`);
      
      options.to.forEach(r => {
        formData.append("to", r.name ? `${r.name} <${r.email}>` : r.email);
      });
      
      formData.append("subject", options.subject);
      formData.append("html", options.html);
      if (options.text) formData.append("text", options.text);
      if (options.replyTo) formData.append("h:Reply-To", options.replyTo);
      
      // RFC-2822 threading headers
      if (options.messageId) formData.append("h:Message-ID", options.messageId);
      if (options.inReplyTo) formData.append("h:In-Reply-To", options.inReplyTo);
      if (options.references) formData.append("h:References", options.references);
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => formData.append(`h:${k}`, v));
      }
      
      if (options.tags) {
        options.tags.forEach(t => formData.append("o:tag", t));
      }

      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({})) as any;

      if (!res.ok) {
        return { success: false, error: data?.message || `Mailgun error ${res.status}` };
      }

      // Mailgun returns <id> we should strip brackets
      let msgId = data.id || "";
      if (msgId.startsWith("<") && msgId.endsWith(">")) {
        msgId = msgId.substring(1, msgId.length - 1);
      }

      return { success: true, providerMessageId: msgId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      const res = await fetch(`${this.baseUrl}/stats/total`, {
        headers: {
          "Authorization": `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
        },
      });
      // 401 or 403 can mean restricted API keys in Mailgun for the stats endpoint
      const isSuccess = res.ok || res.status === 403 || res.status === 401;
      return { success: isSuccess, error: isSuccess ? undefined : `Status ${res.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    // Mailgun wraps events in "event-data"
    const data = rawPayload?.["event-data"];
    if (!data?.event) return null;
    
    const typeMap: Record<string, ProviderEmailEvent["type"]> = {
      "delivered": "delivered",
      "opened": "opened",
      "clicked": "clicked",
      "failed": "bounced_hard", // Mailgun uses 'failed' with severity
      "complained": "complained",
      "unsubscribed": "unsubscribed",
    };

    let eventType = typeMap[data.event];
    if (!eventType) return null;

    let bounceType, bounceReason;
    if (eventType === "bounced_hard") {
      bounceType = data.severity === "temporary" ? "soft" : "hard";
      eventType = bounceType === "soft" ? "bounced_soft" : "bounced_hard";
      bounceReason = data["delivery-status"]?.message || data["delivery-status"]?.description;
    }

    return {
      type: eventType,
      providerMessageId: data.message?.headers?.["message-id"] || "",
      toEmail: data.recipient || "",
      clickedUrl: data.url,
      bounceType: bounceType as any,
      bounceReason,
      timestamp: new Date((data.timestamp || Math.floor(Date.now()/1000)) * 1000),
      rawPayload,
    };
  }
}
