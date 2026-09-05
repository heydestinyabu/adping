import type { Request, Response } from "express";
import { EmailProviderFactory } from "../services/email-providers";

/**
 * Email Domain Controller
 * 
 * Manages domain verification via the platform's email provider (e.g. Resend).
 * Tenants add their domains → platform adds them to Resend → tenant adds DNS records
 * → platform verifies → tenant can send from that domain.
 */
export class EmailDomainController {
  /** List all domains in the platform's Resend account */
  static async listDomains(_req: Request, res: Response) {
    try {
      const provider = await EmailProviderFactory.getActiveProvider();
      if (!provider || !("listDomains" in provider)) {
        return res.status(400).json({ error: "Active provider does not support domain management" });
      }

      const domains = await (provider as any).listDomains();
      res.json(domains);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** Create a new domain in the platform's Resend account */
  static async createDomain(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Domain name is required" });

      const provider = await EmailProviderFactory.getActiveProvider();
      if (!provider || !("createDomain" in provider)) {
        return res.status(400).json({ error: "Active provider does not support domain management" });
      }

      const domain = await (provider as any).createDomain(name);
      res.json(domain);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** Get domain details + DNS records */
  static async getDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const provider = await EmailProviderFactory.getActiveProvider();
      if (!provider || !("getDomain" in provider)) {
        return res.status(400).json({ error: "Active provider does not support domain management" });
      }

      const domain = await (provider as any).getDomain(id);
      res.json(domain);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** Trigger DNS verification for a domain */
  static async verifyDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const provider = await EmailProviderFactory.getActiveProvider();
      if (!provider || !("verifyDomain" in provider)) {
        return res.status(400).json({ error: "Active provider does not support domain management" });
      }

      const result = await (provider as any).verifyDomain(id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** Delete a domain from the platform's Resend account */
  static async deleteDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const provider = await EmailProviderFactory.getActiveProvider();
      if (!provider || !("deleteDomain" in provider)) {
        return res.status(400).json({ error: "Active provider does not support domain management" });
      }

      await (provider as any).deleteDomain(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
