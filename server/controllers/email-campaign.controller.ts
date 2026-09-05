import type { Request, Response } from "express";
import { db } from "../db";
import { campaigns, emailCampaignMeta, campaignRecipients, emailEvents, emailSenders } from "@shared/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { EmailCampaignService } from "../services/email-campaign.service";

export class EmailCampaignController {
  static async create(req: Request, res: Response) {
    try {
      const { 
        name, 
        subject, 
        previewText, 
        htmlContent, 
        plainTextContent,
        emailTemplateId,
        emailSenderId,
        fromNameOverride,
        fromEmailOverride,
        replyTo,
        trackOpens = true,
        trackClicks = true,
        audienceType,
        audienceParams,
        scheduledAt 
      } = req.body;

      // ─── Preflight: active email provider must be configured (superadmin job) ───
      // This is the ONLY hard requirement. Sender identity is optional — the platform
      // default address is used when no user custom domain is set (like Mailchimp, Brevo, etc.)
      const { EmailProviderFactory } = await import("../services/email-providers");
      const providerDetails = await EmailProviderFactory.getActiveProviderDetails();
      if (!providerDetails) {
        return res.status(400).json({
          error: "Email delivery not configured.",
          detail: "The platform admin must configure an email provider (Resend, SendGrid, Mailgun, AWS SES, SMTP etc.) under Admin → Email Infrastructure before campaigns can be sent.",
          code: "NO_PROVIDER",
        });
      }

      // Verify or resolve platform sender address
      const FREE_DOMAINS = ["gmail.com","yahoo.com","hotmail.com","outlook.com","live.com","icloud.com","aol.com","protonmail.com","me.com"];
      const platformFromEmail = providerDetails.defaultFromEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || "onboarding@resend.dev";
      const platformDomain = platformFromEmail.split("@")[1]?.toLowerCase();
      if (platformDomain && FREE_DOMAINS.includes(platformDomain)) {
        return res.status(400).json({
          error: "Platform sender address is invalid.",
          detail: `The admin-configured From Email "${platformFromEmail}" uses a free email domain (@${platformDomain}), which is rejected by email providers. The admin must set a verified business domain address (e.g. noreply@yourplatform.com) in Admin → Email Delivery Providers.`,
          code: "INVALID_PLATFORM_FROM_EMAIL",
        });
      }

      // Sender identity is optional — used only for display name customization.
      // If set, validate it belongs to this user. Domain verification is NOT required
      // (unverified/free-domain senders will just use the platform address as envelope sender
      // and their email as reply-to, like Mailchimp and every other real email SaaS does).
      let senderRecord = null;
      if (emailSenderId) {
        senderRecord = await db.query.emailSenders.findFirst({
          where: and(eq(emailSenders.id, emailSenderId), eq(emailSenders.userId, req.user!.id))
        });
        if (!senderRecord) {
          return res.status(400).json({
            error: "Sender identity not found.",
            detail: "The selected sender identity does not exist or does not belong to your account.",
            code: "SENDER_NOT_FOUND",
          });
        }
      }

      // 1. Create base campaign
      const [campaign] = await db.insert(campaigns)
        .values({
          createdBy: req.user!.id,
          name,
          campaignType: "email",
          type: "marketing",
          apiType: "email_api",
          status: scheduledAt ? "scheduled" : "draft",
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          audienceType: audienceType || "all",
          audienceParams: audienceParams || {},
        })
        .returning();

      // 2. Create email meta
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');
      const [meta] = await db.insert(emailCampaignMeta)
        .values({
          campaignId: campaign.id,
          subject,
          previewText,
          htmlContent,
          plainTextContent,
          emailTemplateId,
          emailSenderId,
          fromNameOverride,
          fromEmailOverride,
          replyTo,
          trackOpens,
          trackClicks,
          unsubscribeToken
        })
        .returning();

      res.json({ ...campaign, emailMeta: meta });

      // 3. Background Population & Processing
      (async () => {
        try {
          const { contacts } = await import("@shared/schema");
          interface RecipientItem {
            contactId: string | null;
            email: string;
            name: string;
          }
          let resolvedRecipients: RecipientItem[] = [];

          // Case 1: Specific Contacts / Certain User(s)
          const targetContactIds = audienceParams?.contactIds || (audienceParams?.contactId ? [audienceParams.contactId] : []);
          if ((audienceType === "specific" || audienceType === "users" || audienceType === "contacts_list") && targetContactIds.length > 0) {
            const selected = await db.select().from(contacts).where(inArray(contacts.id, targetContactIds));
            for (const c of selected) {
              if (c.email && c.email.trim() && c.email.includes("@")) {
                resolvedRecipients.push({
                  contactId: c.id,
                  email: c.email.trim(),
                  name: c.name || c.email.split("@")[0]
                });
              }
            }
          }
          // Case 2: Manual / Direct Email Addresses (pasted list or single email)
          else if (audienceType === "manual" || audienceType === "emails" || audienceParams?.manualEmails) {
            let rawList: string[] = [];
            if (Array.isArray(audienceParams?.manualEmails)) {
              rawList = audienceParams.manualEmails;
            } else if (typeof audienceParams?.manualEmails === "string") {
              rawList = audienceParams.manualEmails.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean);
            }
            const cleanList = Array.from(new Set(rawList.map(e => e.toLowerCase()))).filter(e => e.includes("@"));
            for (const em of cleanList) {
              resolvedRecipients.push({
                contactId: null,
                email: em,
                name: em.split("@")[0]
              });
            }
          }
          // Case 3: Contact Group / Segment
          else if (audienceType === "group") {
            const rawGroupIds = audienceParams?.groupIds || (audienceParams?.groupId ? [audienceParams.groupId] : []);
            if (rawGroupIds.length > 0) {
              const { groups: groupsTable } = await import("@shared/schema");
              const groupRows = await db
                .select({ name: groupsTable.name })
                .from(groupsTable)
                .where(inArray(groupsTable.id, rawGroupIds));
              const groupNames = groupRows.map(r => r.name);

              if (groupNames.length > 0) {
                const allContacts = await db.select().from(contacts);
                const matched = allContacts.filter(c => {
                  const cGroups: string[] = (c.groups as any) || [];
                  return groupNames.some(name => cGroups.includes(name));
                });
                for (const c of matched) {
                  if (c.email && c.email.trim() && c.email.includes("@")) {
                    resolvedRecipients.push({
                      contactId: c.id,
                      email: c.email.trim(),
                      name: c.name || c.email.split("@")[0]
                    });
                  }
                }
              }
            }
          }
          // Case 4: All Contacts with email (audienceType === "all" OR "contacts")
          else {
            const allContacts = await db.select().from(contacts);
            for (const c of allContacts) {
              if (c.email && c.email.trim() && c.email.includes("@")) {
                resolvedRecipients.push({
                  contactId: c.id,
                  email: c.email.trim(),
                  name: c.name || c.email.split("@")[0]
                });
              }
            }
          }

          // Filter out exclusions
          if (audienceParams?.excludedContactIds?.length > 0) {
            resolvedRecipients = resolvedRecipients.filter(r => !r.contactId || !audienceParams.excludedContactIds.includes(r.contactId));
          }

          // Deduplicate by email address
          const emailMap = new Map<string, RecipientItem>();
          for (const item of resolvedRecipients) {
            const key = item.email.toLowerCase();
            if (!emailMap.has(key)) emailMap.set(key, item);
          }
          const uniqueRecipients = Array.from(emailMap.values());

          if (uniqueRecipients.length === 0) {
            console.warn("[EmailCampaign] No reachable email recipients for campaign", campaign.id);
            await db.update(campaigns)
              .set({ status: "failed", recipientCount: 0 })
              .where(eq(campaigns.id, campaign.id));
            return;
          }

          // Mark campaign as sending
          await db.update(campaigns)
            .set({ status: "sending", recipientCount: uniqueRecipients.length })
            .where(eq(campaigns.id, campaign.id));

          // Insert into campaignRecipients
          const recipientValues = uniqueRecipients.map(r => ({
            campaignId: campaign.id,
            contactId: r.contactId || null,
            phone: r.email, // store recipient email in phone column
            name: r.name,
            status: "pending"
          }));

          // Insert in batches of 100
          for (let i = 0; i < recipientValues.length; i += 100) {
            await db.insert(campaignRecipients).values(recipientValues.slice(i, i + 100));
          }

          // Process sending in batches
          let pendingCount = uniqueRecipients.length;
          let totalSent = 0;
          let totalFailed = 0;
          while (pendingCount > 0) {
            const batchResult = await EmailCampaignService.processCampaignBatch(campaign.id, 50);
            if (batchResult.processedCount === 0) break;
            totalSent += batchResult.sentCount;
            totalFailed += batchResult.failedCount;
            pendingCount -= batchResult.processedCount;
          }

          const finalStatus = totalSent > 0 ? "completed" : "failed";
          await db.update(campaigns)
            .set({
              status: finalStatus,
              sentCount: totalSent,
              completedAt: new Date(),
            })
            .where(eq(campaigns.id, campaign.id));

          console.log(`[EmailCampaign] Campaign ${campaign.id} finished (${finalStatus}): ${totalSent} sent, ${totalFailed} failed out of ${uniqueRecipients.length} total.`);

        } catch (bgErr) {
          console.error("[EmailCampaign] Background processing failed:", bgErr);
          await db.update(campaigns)
            .set({ status: "failed" })
            .where(eq(campaigns.id, campaign.id));
        }
      })();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const campaign = await db.query.campaigns.findFirst({
        where: and(eq(campaigns.id, id), eq(campaigns.createdBy, req.user!.id))
      });

      if (!campaign) return res.status(404).json({ error: "Not found" });

      // Aggregate events
      const events = await db.select({
        type: emailEvents.eventType,
        count: sql<number>`count(*)::int`
      })
      .from(emailEvents)
      .where(eq(emailEvents.campaignId, id))
      .groupBy(emailEvents.eventType);

      const failedRecipients = await db.select({
        id: campaignRecipients.id,
        email: campaignRecipients.phone,
        name: campaignRecipients.name,
        errorMessage: campaignRecipients.errorMessage,
      })
      .from(campaignRecipients)
      .where(and(
        eq(campaignRecipients.campaignId, id),
        eq(campaignRecipients.status, "failed")
      ));

      const metrics = {
        sent: campaign.sentCount || 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: failedRecipients.length,
        bounced_hard: 0,
        bounced_soft: 0,
        complained: 0,
        unsubscribed: 0
      };

      events.forEach(e => {
        if (metrics[e.type as keyof typeof metrics] !== undefined) {
          (metrics as any)[e.type] = e.count;
        }
      });

      // Calculate rates
      const openRate = metrics.sent > 0 ? metrics.opened / metrics.sent : 0;
      const clickRate = metrics.sent > 0 ? metrics.clicked / metrics.sent : 0;
      const bounceRate = metrics.sent > 0 ? (metrics.bounced_hard + metrics.bounced_soft) / metrics.sent : 0;

      res.json({ metrics, openRate, clickRate, bounceRate, failures: failedRecipients });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const emailCampaigns = await db.select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        scheduledAt: campaigns.scheduledAt,
        completedAt: campaigns.completedAt,
        createdAt: campaigns.createdAt,
        recipientCount: campaigns.recipientCount,
        sentCount: campaigns.sentCount,
        deliveredCount: campaigns.deliveredCount,
        failedCount: campaigns.failedCount,
        subject: emailCampaignMeta.subject,
        previewText: emailCampaignMeta.previewText,
        fromNameOverride: emailCampaignMeta.fromNameOverride,
        fromEmailOverride: emailCampaignMeta.fromEmailOverride,
      })
      .from(campaigns)
      .innerJoin(emailCampaignMeta, eq(campaigns.id, emailCampaignMeta.campaignId))
      .where(and(
        eq(campaigns.createdBy, req.user!.id),
        eq(campaigns.platform, "email")
      ))
      .orderBy(desc(campaigns.createdAt));

      const campaignIds = emailCampaigns.map(c => c.id);
      let eventCounts: Record<string, { opens: number; clicks: number }> = {};

      if (campaignIds.length > 0) {
        const events = await db.select({
          campaignId: emailEvents.campaignId,
          eventType: emailEvents.eventType,
          count: sql<number>`count(*)::int`
        })
        .from(emailEvents)
        .where(inArray(emailEvents.campaignId, campaignIds))
        .groupBy(emailEvents.campaignId, emailEvents.eventType);

        events.forEach(e => {
          if (!e.campaignId) return;
          if (!eventCounts[e.campaignId]) eventCounts[e.campaignId] = { opens: 0, clicks: 0 };
          if (e.eventType === "opened") eventCounts[e.campaignId].opens += e.count;
          if (e.eventType === "clicked") eventCounts[e.campaignId].clicks += e.count;
        });
      }

      const enriched = emailCampaigns.map(c => {
        const counts = eventCounts[c.id] || { opens: 0, clicks: 0 };
        const sent = c.sentCount || 0;
        const openRate = sent > 0 ? Math.round((counts.opens / sent) * 100) : 0;
        const clickRate = sent > 0 ? Math.round((counts.clicks / sent) * 100) : 0;
        return {
          ...c,
          openedCount: counts.opens,
          clickedCount: counts.clicks,
          openRate,
          clickRate,
        };
      });

      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const campaign = await db.select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        scheduledAt: campaigns.scheduledAt,
        completedAt: campaigns.completedAt,
        createdAt: campaigns.createdAt,
        recipientCount: campaigns.recipientCount,
        sentCount: campaigns.sentCount,
        deliveredCount: campaigns.deliveredCount,
        failedCount: campaigns.failedCount,
        subject: emailCampaignMeta.subject,
        previewText: emailCampaignMeta.previewText,
        htmlContent: emailCampaignMeta.htmlContent,
        fromNameOverride: emailCampaignMeta.fromNameOverride,
        fromEmailOverride: emailCampaignMeta.fromEmailOverride,
        replyTo: emailCampaignMeta.replyTo,
      })
      .from(campaigns)
      .innerJoin(emailCampaignMeta, eq(campaigns.id, emailCampaignMeta.campaignId))
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.createdBy, req.user!.id)
      ))
      .limit(1);

      if (!campaign || campaign.length === 0) return res.status(404).json({ error: "Campaign not found" });
      res.json(campaign[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const [deleted] = await db.delete(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.createdBy, req.user!.id),
          eq(campaigns.platform, "email")
        ))
        .returning();

      if (!deleted) return res.status(404).json({ error: "Campaign not found" });
      res.json({ message: "Campaign deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async sendTestEmail(req: Request, res: Response) {
    try {
      const { recipientEmail, subject, htmlContent, fromName, fromEmail } = req.body;
      if (!recipientEmail || !subject || !htmlContent) {
        return res.status(400).json({ error: "Recipient email, subject, and HTML content are required." });
      }

      const { EmailProviderFactory } = await import("../services/email-providers");
      const provider = await EmailProviderFactory.getActiveProvider();
      if (!provider) {
        return res.status(400).json({
          error: "No active email delivery provider configured.",
          detail: "Please ask your platform administrator to configure an email provider under Admin Settings."
        });
      }

      const providerDetails = await EmailProviderFactory.getActiveProviderDetails();
      const actualFromEmail = fromEmail || providerDetails?.defaultFromEmail || "onboarding@resend.dev";
      const actualFromName = fromName || "ADping";

      await provider.send({
        to: recipientEmail,
        from: `${actualFromName} <${actualFromEmail}>`,
        subject: `[TEST] ${subject}`,
        html: htmlContent,
      });

      res.json({ success: true, message: `Test email sent to ${recipientEmail}` });
    } catch (err: any) {
      console.error("[EmailCampaign] Test email error:", err);
      res.status(500).json({ error: err.message || "Failed to send test email" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const userCampaigns = await db.select({
        id: campaigns.id,
        sentCount: campaigns.sentCount,
        deliveredCount: campaigns.deliveredCount,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(and(
        eq(campaigns.createdBy, req.user!.id),
        eq(campaigns.platform, "email")
      ));

      const totalCampaigns = userCampaigns.length;
      let totalSent = 0;
      let totalDelivered = 0;
      userCampaigns.forEach(c => {
        totalSent += c.sentCount || 0;
        totalDelivered += c.deliveredCount || 0;
      });

      const campaignIds = userCampaigns.map(c => c.id);
      let totalOpens = 0;
      let totalClicks = 0;

      if (campaignIds.length > 0) {
        const events = await db.select({
          eventType: emailEvents.eventType,
          count: sql<number>`count(*)::int`
        })
        .from(emailEvents)
        .where(inArray(emailEvents.campaignId, campaignIds))
        .groupBy(emailEvents.eventType);

        events.forEach(e => {
          if (e.eventType === "opened") totalOpens += e.count;
          if (e.eventType === "clicked") totalClicks += e.count;
        });
      }

      const avgOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
      const avgClickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0;
      const deliveryRate = totalSent > 0 ? Math.round(((totalDelivered || totalSent) / totalSent) * 100) : 100;

      res.json({
        totalCampaigns,
        totalSent,
        totalOpens,
        totalClicks,
        avgOpenRate,
        avgClickRate,
        deliveryRate,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAudienceEstimate(req: Request, res: Response) {
    try {
      const { audienceType = "all", groupId, groupIds, contactIds, manualEmails } = req.query;
      const { contacts, groups } = await import("@shared/schema");

      let resolved: Array<{ name: string; email: string }> = [];

      if ((audienceType === "specific" || audienceType === "users") && contactIds) {
        const idList = Array.isArray(contactIds)
          ? (contactIds as string[])
          : String(contactIds).split(",").map(s => s.trim()).filter(Boolean);
        if (idList.length > 0) {
          const rows = await db.select().from(contacts).where(inArray(contacts.id, idList));
          for (const r of rows) {
            if (r.email && r.email.trim() && r.email.includes("@")) {
              resolved.push({ name: r.name, email: r.email.trim() });
            }
          }
        }
      } else if (audienceType === "manual" && manualEmails) {
        const raw = String(manualEmails);
        const list = raw.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes("@"));
        const unique = Array.from(new Set(list.map(e => e.toLowerCase())));
        resolved = unique.map(em => ({ name: em.split("@")[0], email: em }));
      } else if (audienceType === "group") {
        const rawGroups = groupIds ? (Array.isArray(groupIds) ? (groupIds as string[]) : String(groupIds).split(",")) : (groupId ? [String(groupId)] : []);
        if (rawGroups.length > 0) {
          const groupRows = await db.select({ name: groups.name }).from(groups).where(inArray(groups.id, rawGroups));
          const groupNames = groupRows.map(g => g.name);
          const allContacts = await db.select().from(contacts);
          const matched = allContacts.filter(c => {
            const cGroups: string[] = (c.groups as any) || [];
            return groupNames.some(gn => cGroups.includes(gn));
          });
          for (const c of matched) {
            if (c.email && c.email.trim() && c.email.includes("@")) {
              resolved.push({ name: c.name, email: c.email.trim() });
            }
          }
        }
      } else {
        // All contacts with email
        const allContacts = await db.select().from(contacts);
        for (const c of allContacts) {
          if (c.email && c.email.trim() && c.email.includes("@")) {
            resolved.push({ name: c.name, email: c.email.trim() });
          }
        }
      }

      // Deduplicate by lowercase email
      const map = new Map<string, { name: string; email: string }>();
      for (const item of resolved) {
        const key = item.email.toLowerCase();
        if (!map.has(key)) map.set(key, item);
      }
      const uniqueList = Array.from(map.values());

      res.json({
        total: uniqueList.length,
        samples: uniqueList.slice(0, 5),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async searchContactsWithEmail(req: Request, res: Response) {
    try {
      const { query = "", limit = 50 } = req.query;
      const { contacts } = await import("@shared/schema");

      const all = await db.select().from(contacts);
      const q = String(query).toLowerCase().trim();

      const filtered = all.filter(c => {
        const hasEmail = Boolean(c.email && c.email.trim() && c.email.includes("@"));
        if (!hasEmail) return false;
        if (!q) return true;
        return (c.name && c.name.toLowerCase().includes(q)) || (c.email && c.email.toLowerCase().includes(q));
      });

      res.json({
        contacts: filtered.slice(0, Number(limit)).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email?.trim(),
          phone: c.phone,
          groups: c.groups || [],
        })),
        total: filtered.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
