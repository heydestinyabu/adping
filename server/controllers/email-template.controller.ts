import type { Request, Response } from "express";
import { db } from "../db";
import { emailTemplates } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

export class EmailTemplateController {
  static async list(req: Request, res: Response) {
    try {
      const templates = await db.select().from(emailTemplates)
        .where(or(
          eq(emailTemplates.userId, req.user!.id),
          eq(emailTemplates.isSystem, true)
        ));
      res.json(templates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const template = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.id, req.params.id),
          or(
            eq(emailTemplates.userId, req.user!.id),
            eq(emailTemplates.isSystem, true)
          )
        )
      });
      if (!template) return res.status(404).json({ error: "Not found" });
      res.json(template);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, category, subject, previewText, jsonContent, htmlContent, plainTextContent, thumbnail } = req.body;
      
      const [template] = await db.insert(emailTemplates)
        .values({
          userId: req.user!.id,
          name,
          category,
          subject,
          previewText,
          jsonContent,
          htmlContent,
          plainTextContent,
          thumbnail,
          isSystem: false // Users can only create non-system templates
        })
        .returning();

      res.json(template);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, category, subject, previewText, jsonContent, htmlContent, plainTextContent, thumbnail } = req.body;

      // Prevent updating system templates
      const existing = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, id)
      });
      
      if (!existing || (existing.isSystem && existing.userId !== req.user!.id)) {
        return res.status(403).json({ error: "Cannot modify system templates" });
      }

      const [template] = await db.update(emailTemplates)
        .set({
          name, category, subject, previewText, jsonContent, htmlContent, plainTextContent, thumbnail,
          updatedAt: new Date()
        })
        .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, req.user!.id)))
        .returning();

      res.json(template);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db.delete(emailTemplates)
        .where(and(
          eq(emailTemplates.id, id),
          eq(emailTemplates.userId, req.user!.id),
          eq(emailTemplates.isSystem, false)
        ));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
