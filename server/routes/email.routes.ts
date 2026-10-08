import { Router } from "express";
import { EmailProviderController } from "../controllers/email-provider.controller";
import { EmailSenderController } from "../controllers/email-sender.controller";
import { EmailTemplateController } from "../controllers/email-template.controller";
import { EmailCampaignController } from "../controllers/email-campaign.controller";
import { EmailDomainController } from "../controllers/email-domain.controller";
import { requireAuth, requireSuperadmin, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// --- Provider Configs (Superadmin & Admin) ---
router.get("/providers", requireAuth, requireRole("superadmin", "admin"), EmailProviderController.list);
router.post("/providers", requireAuth, requireRole("superadmin", "admin"), EmailProviderController.save);
router.post("/providers/verify", requireAuth, requireRole("superadmin", "admin"), EmailProviderController.verify);
router.get("/providers/active", requireAuth, EmailProviderController.getActive);

// --- Domain Management (Tenant admins manage their domains via platform's provider) ---
router.get("/domains", requireAuth, EmailDomainController.listDomains);
router.post("/domains", requireAuth, EmailDomainController.createDomain);
router.get("/domains/:id", requireAuth, EmailDomainController.getDomain);
router.post("/domains/:id/verify", requireAuth, EmailDomainController.verifyDomain);
router.delete("/domains/:id", requireAuth, EmailDomainController.deleteDomain);

// --- Sender Identities (Tenant Admins) ---
router.get("/senders", requireAuth, EmailSenderController.list);
router.post("/senders", requireAuth, EmailSenderController.create);
router.put("/senders/:id", requireAuth, EmailSenderController.update);
router.delete("/senders/:id", requireAuth, EmailSenderController.delete);
router.post("/senders/:id/verify", requireAuth, EmailSenderController.verifyDns);

// --- Templates ---
router.get("/templates", requireAuth, EmailTemplateController.list);
router.get("/templates/:id", requireAuth, EmailTemplateController.get);
router.post("/templates", requireAuth, EmailTemplateController.create);
router.put("/templates/:id", requireAuth, EmailTemplateController.update);
router.delete("/templates/:id", requireAuth, EmailTemplateController.delete);

// --- Campaigns ---
router.get("/audience-estimate", requireAuth, EmailCampaignController.getAudienceEstimate);
router.get("/contacts-search", requireAuth, EmailCampaignController.searchContactsWithEmail);
router.post("/update-contact-email", requireAuth, EmailCampaignController.updateContactEmail);
router.get("/campaigns", requireAuth, EmailCampaignController.list);
router.get("/campaigns/stats", requireAuth, EmailCampaignController.getStats);
router.post("/campaigns", requireAuth, EmailCampaignController.create);
router.post("/campaigns/test", requireAuth, EmailCampaignController.sendTestEmail);
router.get("/campaigns/:id", requireAuth, EmailCampaignController.getById);
router.delete("/campaigns/:id", requireAuth, EmailCampaignController.delete);
router.get("/campaigns/:id/analytics", requireAuth, EmailCampaignController.getAnalytics);

export default router;
