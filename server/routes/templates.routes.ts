import type { Express } from "express";
import { diployLogger, HTTP_STATUS, DIPLOY_BRAND } from "@diploy/core";
import * as templatesController from "../controllers/templates.controller";
import { validateRequest } from "../middlewares/validation.middleware";
import { insertTemplateSchema } from "@shared/schema";
import { extractChannelId } from "../middlewares/channel.middleware";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";
import { PERMISSIONS } from "@shared/schema";
import { handleDigitalOceanUpload, upload, validateUploadedFiles } from "../middlewares/upload.middleware";


export function registerTemplateRoutes(app: Express) {
  // Get all templates
  app.get("/api/templates",
    extractChannelId,requireAuth,
    requirePermission(PERMISSIONS.TEMPLATES_VIEW),
    templatesController.getTemplates
  );

  // Get single template
  app.get("/api/templates/:id",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_VIEW), templatesController.getTemplate);


  app.post("/api/getTemplateByUserId", requireAuth, templatesController.getTemplateByUserID)


   app.get("/api/templatesByUserId",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_VIEW), templatesController.getTemplatesByUser);

  // Create template
  app.post("/api/templates",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_CREATE),
    // validateRequest(insertTemplateSchema),
    upload.fields([
      { name: "mediaFile", maxCount: 1 },
      { name: "carouselCardMedia_0", maxCount: 1 },
      { name: "carouselCardMedia_1", maxCount: 1 },
      { name: "carouselCardMedia_2", maxCount: 1 },
      { name: "carouselCardMedia_3", maxCount: 1 },
      { name: "carouselCardMedia_4", maxCount: 1 },
      { name: "carouselCardMedia_5", maxCount: 1 },
      { name: "carouselCardMedia_6", maxCount: 1 },
      { name: "carouselCardMedia_7", maxCount: 1 },
      { name: "carouselCardMedia_8", maxCount: 1 },
      { name: "carouselCardMedia_9", maxCount: 1 },
    ]),
    validateUploadedFiles,
    templatesController.createTemplate
  );

  // Update template
  app.put("/api/templates/:id",requireAuth, upload.fields([
      { name: "mediaFile", maxCount: 1 },
      { name: "carouselCardMedia_0", maxCount: 1 },
      { name: "carouselCardMedia_1", maxCount: 1 },
      { name: "carouselCardMedia_2", maxCount: 1 },
      { name: "carouselCardMedia_3", maxCount: 1 },
      { name: "carouselCardMedia_4", maxCount: 1 },
      { name: "carouselCardMedia_5", maxCount: 1 },
      { name: "carouselCardMedia_6", maxCount: 1 },
      { name: "carouselCardMedia_7", maxCount: 1 },
      { name: "carouselCardMedia_8", maxCount: 1 },
      { name: "carouselCardMedia_9", maxCount: 1 },
    ]), validateUploadedFiles, templatesController.updateTemplate);

  // Delete template
  app.delete("/api/templates/:id",requireAuth, templatesController.deleteTemplate);

  // Sync templates with WhatsApp
  app.post("/api/templates/sync",requireAuth,
  requirePermission(PERMISSIONS.TEMPLATES_SYNC), templatesController.syncTemplates);

  // Seed templates
  app.post("/api/templates/seed",
    requireAuth,
    extractChannelId,
    templatesController.seedTemplates
  );
}