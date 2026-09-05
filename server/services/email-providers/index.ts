import { BaseEmailProvider } from "./base.provider";
import { ResendProvider } from "./resend.provider";
import { AwsSesProvider } from "./aws-ses.provider";
import { SendGridProvider } from "./sendgrid.provider";
import { BrevoProvider } from "./brevo.provider";
import { MailgunProvider } from "./mailgun.provider";
import { PostmarkProvider } from "./postmark.provider";
import { SparkPostProvider } from "./sparkpost.provider";
import { SmtpProvider } from "./smtp.provider";

import { db } from "../../db";
import { emailProviderConfigs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class EmailProviderFactory {
  static createProvider(type: string, config: any): BaseEmailProvider {
    switch (type) {
      case "resend": return new ResendProvider(config);
      case "aws_ses": return new AwsSesProvider(config);
      case "sendgrid": return new SendGridProvider(config);
      case "brevo": return new BrevoProvider(config);
      case "mailgun": return new MailgunProvider(config);
      case "postmark": return new PostmarkProvider(config);
      case "sparkpost": return new SparkPostProvider(config);
      case "smtp": return new SmtpProvider(config);
      default:
        throw new Error(`Unsupported email provider type: ${type}`);
    }
  }

  static async getActiveProviderDetails(): Promise<{
    provider: BaseEmailProvider;
    defaultFromName?: string;
    defaultFromEmail?: string;
  } | null> {
    const [activeConfig] = await db
      .select()
      .from(emailProviderConfigs)
      .where(and(
        eq(emailProviderConfigs.isActive, true),
        eq(emailProviderConfigs.isDefault, true)
      ))
      .limit(1);

    if (activeConfig && activeConfig.config) {
      let defaultFromEmail = activeConfig.defaultFromEmail || activeConfig.config?.defaultFromEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM;
      if (!defaultFromEmail && activeConfig.providerType === "resend") {
        defaultFromEmail = "onboarding@resend.dev";
      }

      return {
        provider: this.createProvider(activeConfig.providerType, activeConfig.config),
        defaultFromName: activeConfig.defaultFromName || activeConfig.config?.defaultFromName || "Platform",
        defaultFromEmail: defaultFromEmail || undefined,
      };
    }

    // Fallback: check if standard SMTP configuration exists (via DB or .env)
    const { getSMTPConfig } = await import("../../controllers/smtp.controller");
    const smtp = await getSMTPConfig();
    if (smtp && smtp.host) {
      return {
        provider: new SmtpProvider({
          host: smtp.host,
          port: typeof smtp.port === "string" ? parseInt(smtp.port, 10) : smtp.port,
          user: smtp.user,
          password: smtp.password || "",
          secure: smtp.secure ?? (smtp.port === 465),
        }),
        defaultFromName: smtp.fromName,
        defaultFromEmail: smtp.fromEmail,
      };
    }

    return null;
  }

  static async getActiveProvider(): Promise<BaseEmailProvider | null> {
    const details = await this.getActiveProviderDetails();
    return details ? details.provider : null;
  }
}
