import { Router } from "express";
import { EmailTrackingService } from "../services/email-tracking.service";
import { EmailInboundController } from "../controllers/email-inbound.controller";

const router = Router();

// Transparent 1x1 GIF for pixel tracking
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

router.get("/track/open/:campaignId/:recipientId.gif", async (req, res) => {
  const { campaignId, recipientId } = req.params;

  try {
    await EmailTrackingService.logEvent({
      campaignId,
      recipientId,
      eventType: "opened",
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent")
    });
  } catch (err) {
    console.error("[Email Tracking] Open tracking failed:", err);
  }

  res.set("Content-Type", "image/gif");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.send(PIXEL);
});

router.get("/track/click/:campaignId/:recipientId/:hash", async (req, res) => {
  const { campaignId, recipientId, hash } = req.params;
  const targetUrl = req.query.url as string;

  if (!targetUrl) return res.status(400).send("Missing target URL");

  // Verify hash
  const expectedHash = EmailTrackingService.generateLinkHash(targetUrl, recipientId);
  if (hash !== expectedHash) {
    return res.status(403).send("Invalid tracking signature");
  }

  try {
    await EmailTrackingService.logEvent({
      campaignId,
      recipientId,
      eventType: "clicked",
      clickedUrl: targetUrl,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent")
    });
  } catch (err) {
    console.error("[Email Tracking] Click tracking failed:", err);
  }

  res.redirect(targetUrl);
});

router.get("/unsubscribe/:campaignId/:contactId", async (req, res) => {
  // Real implementation would render an unsubscribe confirmation page
  // and update the emailSuppressions table
  res.send("You have been unsubscribed from this list.");
});

// Provider Webhooks
router.post("/webhooks/email/inbound/:provider", EmailInboundController.handleWebhook);
router.post("/webhooks/email/events/:provider", EmailInboundController.handleEventWebhook);

export default router;
