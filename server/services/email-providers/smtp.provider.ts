import {
  BaseEmailProvider,
  type SendEmailOptions,
  type SendResult,
  type VerifyConnectionResult,
  type EmailProviderCapabilities,
  type ProviderEmailEvent,
} from "./base.provider";
import * as nodemailer from "nodemailer";

export class SmtpProvider extends BaseEmailProvider {
  readonly name = "Generic SMTP";
  readonly providerType = "smtp";
  readonly capabilities: EmailProviderCapabilities = {
    webhooks: false, // Standard SMTP doesn't support webhooks
    bounceWebhooks: false,
    openTracking: false, // We will have to implement pixel tracking manually for this
    clickTracking: false, // We will have to rewrite URLs manually for this
    inboundEmail: false, // Would require IMAP, not SMTP
  };

  private transporter: nodemailer.Transporter;

  constructor(config: { host: string; port: number | string; user: string; password: string; secure?: boolean }) {
    super();
    const port = typeof config.port === "string" ? parseInt(config.port, 10) : config.port;
    const secure = config.secure ?? port === 465;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port,
      secure,
      ...(!secure && (port === 587 || port === 2525 || !!config.secure) ? { requireTLS: true } : {}),
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
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

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, providerMessageId: result.messageId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async verifyConnection(): Promise<VerifyConnectionResult> {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
