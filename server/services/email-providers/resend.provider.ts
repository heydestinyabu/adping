/**
 * Resend Email Provider
 * Docs: https://resend.com/docs
 * Best for: Excellent deliverability, modern API, great DX
 */
import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
  type InboundEmail,
} from "./base.provider";

export class ResendProvider extends BaseEmailProvider {
  readonly name = "Resend";
  readonly providerType = "resend";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: true,
    bounceWebhooks: true,
    openTracking: true,
    clickTracking: true,
    inboundEmail: false, // Resend inbound is in beta
  };

  private apiKey: string;
  private baseUrl = "https://api.resend.com";

  constructor(config: { apiKey: string }) {
    super();
    this.apiKey = config.apiKey?.trim();
  }

  async send(options: SendEmailOptions): Promise<SendResult> {
    try {
      const payload: any = {
        from: `${options.from.name} <${options.from.email}>`,
        to: options.to.map((r) => r.name ? `${r.name} <${r.email}>` : r.email),
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        tags: options.tags?.map((t) => ({ name: "category", value: t })),
        headers: options.headers || {},
      };

      // RFC-2822 threading headers
      if (options.messageId) payload.headers["Message-ID"] = options.messageId;
      if (options.inReplyTo) payload.headers["In-Reply-To"] = options.inReplyTo;
      if (options.references) payload.headers["References"] = options.references;
      const res = await fetch(`${this.baseUrl}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        return { success: false, error: data?.message || `Resend error ${res.status}` };
      }

      return { success: true, providerMessageId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {

    try {
      const res = await fetch(`${this.baseUrl}/domains`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      // 403 or 401 can mean the key is valid but restricted (e.g. sending only), which is fine.
      const data = await res.clone().json().catch(() => ({}));
      const isSuccess = res.ok || res.status === 403 || (res.status === 401 && data?.name === "restricted_api_key");
      return { success: isSuccess, error: isSuccess ? undefined : `Status ${res.status}: ${data?.message || ''}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  parseEventWebhook(rawPayload: any): ProviderEmailEvent | null {
    const type = rawPayload?.type as string;
    const data = rawPayload?.data;
    if (!type || !data) return null;

    const map: Record< string, ProviderEmailEvent["type"]> = {
      "email.delivered": "delivered",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced_hard",
      "email.complained": "complained",
    };

    const eventType = map[type];
    if (!eventType) return null;

    return {
      type: eventType,
      providerMessageId: data.email_id || "",
      toEmail: data.to?.[0] || "",
      clickedUrl: data.click?.link,
      bounceType: type === "email.bounced" ? "hard" : undefined,
      bounceReason: data.bounce?.message,
      timestamp: new Date(rawPayload.created_at || Date.now()),
      rawPayload,
    };
  }

  // ─── Domain Management (Resend API) ───────────────────────────

  /** List all domains in the Resend account */
  async listDomains(): Promise<{ id: string; name: string; status: string; records: any[] }[]> {
    const res = await fetch(`${this.baseUrl}/domains`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data?.message || `Resend error ${res.status}`);
    return data.data || [];
  }

  /** Create a new domain in Resend — returns DNS records the tenant must add */
  async createDomain(domainName: string): Promise<{ id: string; name: string; records: any[] }> {
    const res = await fetch(`${this.baseUrl}/domains`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domainName, region: "us-east-1" }),
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data?.message || `Resend error ${res.status}`);
    return { id: data.id, name: data.name, records: data.records || [] };
  }

  /** Get domain details + DNS records by ID */
  async getDomain(domainId: string): Promise<{ id: string; name: string; status: string; records: any[] }> {
    const res = await fetch(`${this.baseUrl}/domains/${domainId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data?.message || `Resend error ${res.status}`);
    return { id: data.id, name: data.name, status: data.status, records: data.records || [] };
  }

  /** Trigger DNS verification for a domain */
  async verifyDomain(domainId: string): Promise<{ id: string; name: string; status: string; records: any[] }> {
    const res = await fetch(`${this.baseUrl}/domains/${domainId}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data?.message || `Resend error ${res.status}`);
    return { id: data.id, name: data.name, status: data.status, records: data.records || [] };
  }

  /** Delete a domain from Resend */
  async deleteDomain(domainId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/domains/${domainId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as any;
      throw new Error(data?.message || `Resend error ${res.status}`);
    }
  }
}
