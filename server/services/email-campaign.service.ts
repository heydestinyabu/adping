import { db } from "../db";
import { 
  campaigns, 
  emailCampaignMeta, 
  campaignRecipients, 
  contacts,
  emailSenders
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { EmailProviderFactory } from "./email-providers";
import { EmailTrackingService } from "./email-tracking.service";
import { resolvePublicOrigin } from "./public-origin";

function renderTemplate(template: string, vars: Record<string, any>): string {
  if (!template) return "";
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

export interface BatchProcessResult {
  sentCount: number;
  failedCount: number;
  processedCount: number;
}

export class EmailCampaignService {
  /**
   * Processes a batch of emails for a campaign.
   * This would typically be called by a BullMQ worker.
   */
  static async processCampaignBatch(campaignId: string, limit = 100): Promise<BatchProcessResult> {
    const campaignMeta = await db.query.emailCampaignMeta.findFirst({
      where: eq(emailCampaignMeta.campaignId, campaignId),
      with: { emailSender: true }
    });

    if (!campaignMeta) throw new Error("Email campaign metadata not found");
    console.log(`[EmailCampaign] Processing batch for campaign ${campaignId} — meta found, subject: "${campaignMeta.subject}"`);

    const providerDetails = await EmailProviderFactory.getActiveProviderDetails();
    if (!providerDetails) throw new Error("No active email provider found. Go to Settings → Email Providers and configure one.");
    const activeProvider = providerDetails.provider;
    console.log(`[EmailCampaign] Using provider: ${activeProvider.name}`);

    // Fetch pending recipients
    const recipients = await db
      .select({
        recipient: campaignRecipients,
        contact: contacts
      })
      .from(campaignRecipients)
      .leftJoin(contacts, eq(campaignRecipients.contactId, contacts.id))
      .where(and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "pending")
      ))
      .limit(limit);

    if (recipients.length === 0) {
      console.log(`[EmailCampaign] No pending recipients for campaign ${campaignId}`);
      return { sentCount: 0, failedCount: 0, processedCount: 0 };
    }
    console.log(`[EmailCampaign] Found ${recipients.length} pending recipient(s) to process`);

    const baseUrl = await resolvePublicOrigin();
    let sentCount = 0;
    let failedCount = 0;

    for (const { recipient, contact } of recipients) {
      try {
        const recipientEmail = contact?.email?.trim() || (recipient.phone && recipient.phone.includes("@") ? recipient.phone.trim() : null);
        if (!recipientEmail) {
          throw new Error("Recipient missing email address");
        }

        const recipientName = contact?.name || recipient.name || recipientEmail.split("@")[0];

        // Render template with variable replacement
        const templateVars = {
          name: recipientName,
          firstName: recipientName.split(" ")[0] || recipientName,
          email: recipientEmail,
        };

        let finalHtml = renderTemplate(campaignMeta.htmlContent || "", templateVars);
        const finalSubject = renderTemplate(campaignMeta.subject || "", templateVars);

        // Inject tracking if enabled
        if (campaignMeta.trackOpens || campaignMeta.trackClicks) {
          finalHtml = EmailTrackingService.injectTracking(
            finalHtml, 
            campaignId, 
            recipient.id,
            baseUrl || "https://localhost:5000"
          );
        }

        // Add unsubscribe link
        const unsubId = contact?.id || recipient.id;
        const unsubUrl = `${baseUrl}/api/public/email/unsubscribe/${campaignId}/${unsubId}`;
        finalHtml = finalHtml.replace(/\{\{\s*(?:unsubscribe_url|unsubscribeUrl)\s*\}\}/g, unsubUrl);

        // ─── Resolve sender identity (industry-standard pattern) ──────────────
        //
        // How every real email marketing platform works:
        //   FROM display: "John's Store"               ← user controls this
        //   FROM address: noreply@yourplatform.com      ← platform verified domain (the one the admin set up on Resend/SendGrid/etc.)
        //   REPLY-TO:     john@gmail.com                ← user's actual email (users CAN use Gmail here)
        //
        // Optional upgrade: users with their own verified business domain bypass this and send
        // from their own address (custom domain feature).

        const FREE_DOMAINS = ["gmail.com","yahoo.com","hotmail.com","outlook.com","live.com","icloud.com","aol.com","protonmail.com","me.com"];

        const sender = campaignMeta.emailSender;
        const senderFromEmail = campaignMeta.fromEmailOverride || sender?.fromEmail;
        const senderDomain = senderFromEmail?.split("@")[1]?.toLowerCase();
        const senderHasCustomVerifiedDomain = sender?.domainVerified && sender?.sendingDomain && senderFromEmail && !FREE_DOMAINS.includes(senderDomain || "");

        let fromName: string;
        let fromEmail: string;
        let replyTo: string;

        if (senderHasCustomVerifiedDomain && senderFromEmail) {
          // ✅ Premium path: user has their own verified domain — send from their brand address
          fromName = campaignMeta.fromNameOverride || sender?.fromName || providerDetails.defaultFromName || "Platform";
          fromEmail = senderFromEmail;
          replyTo = campaignMeta.replyTo || sender?.replyTo || fromEmail;
        } else {
          // ✅ Standard path (most users): use platform verified domain, user's name as display
          // This is exactly how Mailchimp, Brevo, ConvertKit work by default.
          const platformEmail = providerDetails.defaultFromEmail 
            || process.env.SMTP_FROM_EMAIL 
            || process.env.SMTP_FROM 
            || (activeProvider.name?.toLowerCase().includes("resend") ? "onboarding@resend.dev" : "noreply@platform.com");

          fromName = campaignMeta.fromNameOverride || sender?.fromName || providerDetails.defaultFromName || "Platform";
          fromEmail = platformEmail;
          // User's email (even Gmail) becomes reply-to — completely fine and expected
          replyTo = campaignMeta.replyTo || sender?.replyTo || senderFromEmail || fromEmail;
        }

        // Sanitize: ensure fromEmail and replyTo are valid email addresses (e.g. if user entered just a domain like 'laikiedu.com')
        if (fromEmail && !fromEmail.includes("@")) {
          fromEmail = `noreply@${fromEmail.trim()}`;
        }
        if (replyTo && !replyTo.includes("@")) {
          replyTo = `noreply@${replyTo.trim()}`;
        }

        console.log(`[EmailCampaign] Sending to ${recipientEmail} | From: "${fromName} <${fromEmail}>" | Reply-To: ${replyTo} | Subject: "${finalSubject}"`);

        const result = await activeProvider.send({
          from: { name: fromName, email: fromEmail },
          to: [{ name: recipientName || undefined, email: recipientEmail }],
          subject: finalSubject,
          html: finalHtml,
          replyTo: replyTo,
          tags: [campaignId],
        });

        if (result.success) {
          console.log(`[EmailCampaign] ✅ Sent to ${recipientEmail} — provider message ID: ${result.providerMessageId}`);
          await db.update(campaignRecipients)
            .set({ 
              status: "sent", 
              sentAt: new Date(),
              whatsappMessageId: result.providerMessageId
            })
            .where(eq(campaignRecipients.id, recipient.id));
          
          sentCount++;
        } else {
          throw new Error(result.error || "Provider failed to send");
        }

      } catch (err: any) {
        failedCount++;
        console.error(`[EmailCampaign] Failed sending to recipient ${recipient.id} (${contact?.email || 'no-email'}):`, err?.message || err);
        await db.update(campaignRecipients)
          .set({ 
            status: "failed", 
            errorMessage: err?.message || "Send failed",
            updatedAt: new Date()
          })
          .where(eq(campaignRecipients.id, recipient.id));
      }
    }

    return { sentCount, failedCount, processedCount: recipients.length };
  }
}
