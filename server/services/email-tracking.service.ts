import { db } from "../db";
import { emailEvents, campaigns, campaignRecipients, contacts } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export class EmailTrackingService {
  /**
   * Generates a secure hash for a link to track clicks.
   */
  static generateLinkHash(url: string, recipientId: string): string {
    return crypto
      .createHmac("sha256", process.env.SESSION_SECRET || "default_secret")
      .update(`${url}:${recipientId}`)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Injects tracking pixel and URL trackers into the HTML content.
   */
  static injectTracking(
    html: string,
    campaignId: string,
    recipientId: string,
    trackingBaseUrl: string
  ): string {
    let trackedHtml = html;

    // 1. Inject Open Tracking Pixel (just before </body> or at the end)
    const pixelUrl = `${trackingBaseUrl}/api/public/email/track/open/${campaignId}/${recipientId}.gif`;
    const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
    
    if (trackedHtml.includes("</body>")) {
      trackedHtml = trackedHtml.replace("</body>", `${pixelTag}</body>`);
    } else {
      trackedHtml += pixelTag;
    }

    // 2. Rewrite URLs for click tracking (very basic regex approach for MVP)
    // A robust implementation would use an HTML parser like cheerio.
    const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/g;
    trackedHtml = trackedHtml.replace(hrefRegex, (match, url) => {
      // Don't rewrite unsubscribe links if they are already tracked
      if (url.includes("/api/public/email/unsubscribe")) return match;

      const linkHash = this.generateLinkHash(url, recipientId);
      const encodedUrl = encodeURIComponent(url);
      const trackUrl = `${trackingBaseUrl}/api/public/email/track/click/${campaignId}/${recipientId}/${linkHash}?url=${encodedUrl}`;
      
      return `href="${trackUrl}"`;
    });

    return trackedHtml;
  }

  /**
   * Log an event (open, click, bounce, etc)
   */
  static async logEvent(data: {
    campaignId: string;
    recipientId?: string;
    contactId?: string;
    eventType: string;
    providerMessageId?: string;
    clickedUrl?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // If recipient ID is missing but we have providerMessageId, we could look it up.
    // For now, we assume we have recipientId.
    
    // Check if event already exists to prevent duplicate open counts in a short window?
    // We'll just insert everything for now, can group by in analytics queries.

    await db.insert(emailEvents).values({
      campaignId: data.campaignId,
      recipientId: data.recipientId,
      contactId: data.contactId,
      eventType: data.eventType,
      providerMessageId: data.providerMessageId,
      clickedUrl: data.clickedUrl,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      occurredAt: new Date(),
    });

    // Update campaign metrics
    // This could also be done via BullMQ to offload DB writes
    if (data.campaignId) {
      // Very basic counter update example (real app would do this via trigger or batch worker)
      // We skip actual db.update here for brevity and assume it's calculated on read,
      // or updated asynchronously.
    }
  }
}
