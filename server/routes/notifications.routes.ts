import { requireAuth, requireRole } from "server/middlewares/auth.middleware";
import { diployLogger, HTTP_STATUS, DIPLOY_BRAND } from "@diploy/core";
import type { Express } from "express";
import {
  adminCreateNotification,
  adminGetNotifications,
  adminSendNotification,
  userGetNotifications,
  userMarkAsRead,
  userUnreadCount,
  userMarkAllRead,
  getNotificationTemplates,
  updateNotificationTemplate,
  getUserPreferences,
  updateUserPreference,
  deleteNotification,
} from "../controllers/notification.controller";

export function registerNotificationsRoutes(app: Express) {
  app.post("/api/notifications", requireAuth, adminCreateNotification);

  // Send
  app.post("/api/notifications/:id/send", requireAuth, adminSendNotification);

  // List all
  app.get("/api/notifications/", requireAuth,  adminGetNotifications);

  // List all user notifications
  app.get("/api/notifications/users/", requireAuth,  userGetNotifications);

  // Mark as read
  app.post("/api/notifications/:id/read", requireAuth, userMarkAsRead);
 
  // Mark all read
  app.post("/api/notifications/mark-all", requireAuth, userMarkAllRead);

  // Unread count
  app.get("/api/notifications/unread-count", requireAuth, userUnreadCount);

  app.get("/api/notification-templates", requireAuth, getNotificationTemplates);
  app.put("/api/notification-templates/:id", requireAuth, requireRole("superadmin"), updateNotificationTemplate);

  // User notification preferences
  app.get("/api/notification-preferences", requireAuth, getUserPreferences);
  app.put("/api/notification-preferences", requireAuth, updateUserPreference);

  // Delete a sent notification
  app.delete("/api/notifications/:id", requireAuth, deleteNotification);
  
}
