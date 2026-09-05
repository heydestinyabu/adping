/**
 * Email Provider — Base abstraction.
 * All providers implement this interface so the rest of the system
 * doesn't care which provider is active under the hood.
 */

export interface SendEmailOptions {
  from: { name: string; email: string };
  to: { name?: string; email: string }[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  // RFC-2822 threading headers
  messageId?: string;       // Our generated Message-ID
  inReplyTo?: string;       // For threading replies
  references?: string;      // For threading replies
  // DKIM signing fields
  dkimPrivateKey?: string;
  dkimSelector?: string;
  dkimDomain?: string;
  // Metadata
  tags?: string[];
  headers?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface VerifyConnectionResult {
  success: boolean;
  error?: string;
}

export interface EmailProviderCapabilities {
  webhooks: boolean;        // Provider sends delivery/event webhooks back to us
  bounceWebhooks: boolean;  // Provider sends bounce notifications via webhook
  openTracking: boolean;    // Provider has built-in open tracking
  clickTracking: boolean;   // Provider has built-in click tracking
  inboundEmail: boolean;    // Provider can receive/parse inbound emails
}

export abstract class BaseEmailProvider {
  abstract readonly name: string;
  abstract readonly providerType: string;
  abstract readonly capabilities: EmailProviderCapabilities;

  abstract send(options: SendEmailOptions): Promise<SendResult>;
  abstract verifyConnection(): Promise<VerifyConnectionResult>;

  /**
   * Parse a raw inbound webhook payload from this provider.
   * Returns a normalized inbound email object.
   */
  parseInboundWebhook?(rawPayload: any): InboundEmail | null;

  /**
   * Parse a delivery/bounce/complaint webhook from this provider.
   * Returns normalized event data.
   */
  parseEventWebhook?(rawPayload: any): ProviderEmailEvent | null;
}

export interface InboundEmail {
  from: { name?: string; email: string };
  to: { name?: string; email: string }[];
  subject: string;
  html?: string;
  text?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content?: Buffer;
  }>;
  headers?: Record<string, string>;
  receivedAt: Date;
}

export interface ProviderEmailEvent {
  type: "delivered" | "opened" | "clicked" | "bounced_hard" | "bounced_soft" | "complained" | "unsubscribed";
  providerMessageId: string;
  toEmail: string;
  clickedUrl?: string;
  bounceType?: "hard" | "soft";
  bounceReason?: string;
  timestamp: Date;
  rawPayload?: any;
}
