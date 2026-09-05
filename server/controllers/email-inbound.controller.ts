import type { Request, Response } from "express";
import { db } from "../db";
import { emailSenders, conversations, messages, contacts } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { EmailProviderFactory } from "../services/email-providers";
import { channels } from "@shared/schema";

export class EmailInboundController {
  /**
   * Universal webhook endpoint for inbound emails from providers.
   * e.g. POST /api/webhooks/email/inbound/:provider
   */
  static async handleWebhook(req: Request, res: Response) {
    const { provider } = req.params;
    
    try {
      const activeProvider = await EmailProviderFactory.getActiveProvider();
      if (!activeProvider || activeProvider.providerType !== provider || !activeProvider.parseInboundWebhook) {
        return res.status(400).json({ error: "Provider not configured for inbound" });
      }

      const inboundEmail = activeProvider.parseInboundWebhook(req.body);
      if (!inboundEmail) {
        return res.status(400).json({ error: "Failed to parse inbound email" });
      }

      // Find which tenant owns this receiving address
      const toAddress = inboundEmail.to[0]?.email;
      if (!toAddress) return res.status(200).send("No recipient");

      const sender = await db.query.emailSenders.findFirst({
        where: eq(emailSenders.inboundAddress, toAddress)
      });

      if (!sender) {
        console.warn(`[Inbound Email] Unknown destination address: ${toAddress}`);
        return res.status(200).send("OK");
      }

      // Find or create contact based on From address
      let contact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.email, inboundEmail.from.email),
          eq(contacts.tenantId, sender.userId)
        )
      });

      let channelId = "";
      if (!contact) {
        // Need a channelId to insert a contact/conversation
        const defaultChannel = await db.query.channels.findFirst({
          where: eq(channels.createdBy, sender.userId)
        });
        if (!defaultChannel) {
           console.warn(`[Inbound Email] No channel found for user ${sender.userId}`);
           return res.status(200).send("No channel configured");
        }
        channelId = defaultChannel.id;

        [contact] = await db.insert(contacts).values({
          tenantId: sender.userId,
          channelId: channelId,
          name: inboundEmail.from.name || inboundEmail.from.email.split('@')[0],
          phone: "email_" + Date.now(), // dummy phone since it's required
          email: inboundEmail.from.email,
        }).returning();
      } else {
        channelId = contact.channelId;
      }

      // Find or create conversation thread
      let conversation;
      if (inboundEmail.inReplyTo) {
        // Try to match conversation by messageId of the email being replied to
        // We'd store providerMessageId in metadata. For now, create new if not found
      }

      if (!conversation) {
        [conversation] = await db.insert(conversations).values({
          contactId: contact.id,
          channelId: channelId,
          type: "email",
          status: "open",
          lastMessageAt: new Date()
        }).returning();
      }

      // Insert message
      const [message] = await db.insert(messages).values({
        conversationId: conversation.id,
        direction: "inbound",
        status: "received",
        content: inboundEmail.text || inboundEmail.subject,
        metadata: {
          html: inboundEmail.html,
          messageId: inboundEmail.messageId,
          references: inboundEmail.references,
          subject: inboundEmail.subject,
          from: inboundEmail.from,
          to: inboundEmail.to,
        }
      }).returning();

      // Broadcast event to update inbox
      if ((global as any).broadcastToConversation) {
        (global as any).broadcastToConversation(conversation.id, {
          type: "new-message",
          message,
        });
      }

      res.status(200).send("OK");
    } catch (err) {
      console.error("[Email Inbound Webhook Error]", err);
      res.status(500).json({ error: "Internal Error" });
    }
  }

  /**
   * Handle Provider Event Webhooks (Delivered, Opened, Clicked, Bounced, etc)
   */
  static async handleEventWebhook(req: Request, res: Response) {
    const { provider } = req.params;

    try {
      const activeProvider = await EmailProviderFactory.getActiveProvider();
      if (!activeProvider || activeProvider.providerType !== provider || !activeProvider.parseEventWebhook) {
        return res.status(200).send("OK");
      }

      const event = activeProvider.parseEventWebhook(req.body);
      if (!event) {
        return res.status(200).send("OK"); // Acknowledge unhandled event types
      }

      // We need to look up campaignId/recipientId. We'd usually embed this in the providerMessageId or custom tags
      // For simplicity in this demo, if the provider supports extracting campaign metadata, it goes here.
      
      console.log(`[Email Event] ${event.type} for ${event.toEmail}`);
      
      // EmailTrackingService.logEvent(event) ...

      res.status(200).send("OK");
    } catch (err) {
      console.error("[Email Event Webhook Error]", err);
      res.status(500).send("Internal Error");
    }
  }
}
