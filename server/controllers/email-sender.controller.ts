import type { Request, Response } from "express";
import { db } from "../db";
import { emailSenders } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { EmailDomainService } from "../services/email-domain.service";

export class EmailSenderController {
  static async list(req: Request, res: Response) {
    try {
      const senders = await db.select().from(emailSenders)
        .where(eq(emailSenders.userId, req.user!.id))
        .orderBy(desc(emailSenders.id));
      res.json(senders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { fromName, fromEmail, replyTo, sendingDomain, isDefault } = req.body;

      // Note: free email domains (gmail, yahoo etc.) are accepted here as the display identity.
      // The system automatically uses the platform verified domain as the envelope sender
      // and stores the user's email as reply-to. This is how Mailchimp, Brevo, etc. work.
      // Domain verification (for custom sending domain) is handled separately.

      if (isDefault) {
        await db.update(emailSenders)
          .set({ isDefault: false })
          .where(eq(emailSenders.userId, req.user!.id));
      }

      // Generate DKIM if domain provided
      let dkimPrivateKey, dkimPublicKey;
      if (sendingDomain) {
        const keys = EmailDomainService.generateDkimKeys();
        dkimPrivateKey = keys.privateKey;
        dkimPublicKey = keys.publicKey;
      }

      const [sender] = await db.insert(emailSenders)
        .values({
          userId: req.user!.id,
          fromName,
          fromEmail,
          replyTo,
          sendingDomain,
          dkimPrivateKey,
          dkimPublicKey,
          isDefault
        })
        .returning();

      res.json(sender);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fromName, fromEmail, replyTo, sendingDomain, isDefault, inboundMethod, inboundAddress } = req.body;

      // Note: free email domains are allowed — the system will use them as reply-to
      // and route sends through the platform verified domain automatically.

      if (isDefault) {
        await db.update(emailSenders)
          .set({ isDefault: false })
          .where(eq(emailSenders.userId, req.user!.id));
      }

      const existing = await db.query.emailSenders.findFirst({
        where: and(eq(emailSenders.id, id), eq(emailSenders.userId, req.user!.id))
      });

      if (!existing) {
        return res.status(404).json({ error: "Sender not found" });
      }

      let dkimPrivateKey = existing.dkimPrivateKey;
      let dkimPublicKey = existing.dkimPublicKey;

      if (sendingDomain && (!dkimPrivateKey || existing.sendingDomain !== sendingDomain)) {
        const keys = EmailDomainService.generateDkimKeys();
        dkimPrivateKey = keys.privateKey;
        dkimPublicKey = keys.publicKey;
      }

      const [sender] = await db.update(emailSenders)
        .set({
          fromName, fromEmail, replyTo, sendingDomain, isDefault,
          inboundMethod, inboundAddress,
          dkimPrivateKey, dkimPublicKey,
          updatedAt: new Date()
        })
        .where(and(eq(emailSenders.id, id), eq(emailSenders.userId, req.user!.id)))
        .returning();

      res.json(sender);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db.delete(emailSenders)
        .where(and(eq(emailSenders.id, id), eq(emailSenders.userId, req.user!.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async verifyDns(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sender = await db.query.emailSenders.findFirst({
        where: and(eq(emailSenders.id, id), eq(emailSenders.userId, req.user!.id))
      });

      if (!sender || !sender.sendingDomain || !sender.dkimPublicKey) {
        return res.status(400).json({ error: "No domain or DKIM key to verify" });
      }

      const result = await EmailDomainService.verifyDnsRecords(
        sender.sendingDomain,
        sender.dkimSelector || "mailsend",
        sender.dkimPublicKey
      );

      await db.update(emailSenders)
        .set({
          spfVerified: result.spfVerified,
          dkimVerified: result.dkimVerified,
          dmarcVerified: result.dmarcVerified,
          domainVerified: result.spfVerified && result.dkimVerified,
          lastDnsCheckAt: new Date()
        })
        .where(eq(emailSenders.id, id));

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
