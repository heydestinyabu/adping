import type { Request, Response } from "express";
import { db } from "../db";
import { emailProviderConfigs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { EmailProviderFactory } from "../services/email-providers";

export class EmailProviderController {
  static async list(req: Request, res: Response) {
    try {
      const providers = await db.select().from(emailProviderConfigs);
      res.json(providers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getActive(req: Request, res: Response) {
    try {
      const providers = await db.select().from(emailProviderConfigs)
        .where(eq(emailProviderConfigs.isDefault, true))
        .limit(1);
      res.json(providers[0] || null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async save(req: Request, res: Response) {
    try {
      const { providerType, config, label, isDefault, isActive, defaultFromName, defaultFromEmail } = req.body;

      let cleanDefaultFromEmail = defaultFromEmail?.trim();
      if (cleanDefaultFromEmail && !cleanDefaultFromEmail.includes("@")) {
        cleanDefaultFromEmail = `noreply@${cleanDefaultFromEmail}`;
      }

      const mergedConfig = {
        ...(config || {}),
        defaultFromName: defaultFromName || undefined,
        defaultFromEmail: cleanDefaultFromEmail || undefined,
      };

      // If setting this as default, unset others
      if (isDefault) {
        await db.update(emailProviderConfigs).set({ isDefault: false });
      }

      const existing = await db.query.emailProviderConfigs.findFirst({
        where: eq(emailProviderConfigs.providerType, providerType)
      });

      let updated;
      if (existing) {
        [updated] = await db.update(emailProviderConfigs)
          .set({ config: mergedConfig, label, isDefault, isActive, defaultFromName, defaultFromEmail: cleanDefaultFromEmail, updatedAt: new Date() })
          .where(eq(emailProviderConfigs.id, existing.id))
          .returning();
      } else {
        [updated] = await db.insert(emailProviderConfigs)
          .values({ providerType, config: mergedConfig, label, isDefault, isActive, defaultFromName, defaultFromEmail: cleanDefaultFromEmail })
          .returning();
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      const { providerType, config } = req.body;
      const provider = EmailProviderFactory.createProvider(providerType, config);
      const result = await provider.verifyConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
