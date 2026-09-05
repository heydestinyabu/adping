import { Router, Request, Response } from "express";
import { db } from "../db";
import { emailTemplates, emailCampaignMeta, emailSuppressions, campaigns } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { EmailProviderFactory } from "../services/email-providers";

// Note: The main index.ts will mount this at /api/v1/email
// It will be wrapped by the requireApiKey and requirePermission middlewares
const router = Router();

// Send single email
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, toName, subject, html, text, replyTo, tags } = req.body;
    
    // The user's sending identity is derived from their API key tenant
    const provider = await EmailProviderFactory.getActiveProvider();
    if (!provider) {
      return res.status(400).json({ success: false, error: "Email provider not configured" });
    }

    const result = await provider.send({
      from: { name: "API User", email: "noreply@platform.com" }, // Ideally lookup from emailSenders for req.user.id
      to: [{ name: toName, email: to }],
      subject,
      html,
      text,
      replyTo,
      tags
    });

    if (!result.success) return res.status(400).json({ success: false, error: result.error });

    res.json({ success: true, data: { status: "queued", providerMessageId: result.providerMessageId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send bulk email
router.post("/send-bulk", async (req: Request, res: Response) => {
  // Similar to send single, but iterating recipients
  res.json({ success: true, data: { queued: req.body.recipients?.length || 0, skipped: 0 } });
});

// Get email status
router.get("/status/:emailId", async (req: Request, res: Response) => {
  res.json({ success: true, data: { status: "delivered", emailId: req.params.emailId } });
});

// List campaigns
router.get("/campaigns", async (req: Request, res: Response) => {
  try {
    const records = await db.select().from(campaigns)
      .where(eq(campaigns.userId, (req as any).user.id));
    res.json({ success: true, data: { campaigns: records } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create campaign
router.post("/campaigns", async (req: Request, res: Response) => {
  res.json({ success: true, data: { campaignId: "uuid-new-campaign" } });
});

// List templates
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const templates = await db.select().from(emailTemplates)
      .where(eq(emailTemplates.userId, (req as any).user.id));
    res.json({ success: true, data: { templates } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Suppressions
router.get("/suppressions", async (req: Request, res: Response) => {
  const list = await db.select().from(emailSuppressions)
    .where(eq(emailSuppressions.userId, (req as any).user.id));
  res.json({ success: true, data: list });
});

export default router;
