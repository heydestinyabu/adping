// import { Request, Response, NextFunction } from "express";
// import { eq } from "drizzle-orm";
// import { db } from "server/db";
// import { plans, subscriptions , channels, automations, campaigns, contacts, users, sites } from "@shared/schema";

// export const requireSubscription = (
//     requiredPermission: "channel" | "contacts" | "automation" | "campaign"
//   ) => {
//     return async (req: Request, res: Response, next: NextFunction) => {
//       try {
//         let userId: string | null = null;
  
//         const sessionUser = (req.session as any).user;
//         const siteId = req.body.siteId;
  
//         // 🔹 CASE 1: Normal authenticated API
//         if (sessionUser) {
//           userId = sessionUser.id;
//         }
  
//         // 🔹 CASE 2: Public widget API — no session
//         else if (siteId) {
//           // Get site
//           const [site] = await db
//             .select()
//             .from(sites)
//             .where(eq(sites.id, siteId));
  
//           if (!site) {
//             return res.status(404).json({ error: "Invalid siteId." });
//           }
  
//           // Site → channel
//           const [channel] = await db
//             .select()
//             .from(channels)
//             .where(eq(channels.id, site.channelId));
  
//           if (!channel) {
//             return res.status(404).json({ error: "Channel not found." });
//           }
  
//           // Channel → User (owner)
//           userId = channel.createdBy;
//         }
  
//         // ❌ No session + no siteId → reject
//         else {
//           return res.status(401).json({ error: "Unauthorized" });
//         }
  
//         // Now userId always exists — public or private API
//         // 1️⃣ Get subscription
//         const [sub] = await db
//           .select()
//           .from(subscriptions)
//           .where(eq(subscriptions.userId, userId));
  
//         if (!sub) {
//           return res.status(403).json({ error: "Subscription required." });
//         }
  
//         if (sub.status !== "active") {
//           return res.status(403).json({ error: "Subscription not active." });
//         }
  
//         if (new Date(sub.endDate) < new Date()) {
//           return res.status(403).json({ error: "Subscription expired." });
//         }
  
//         // 2️⃣ Get plan
//         const [plan] = await db
//           .select()
//           .from(plans)
//           .where(eq(plans.id, sub.planId));
  
//         if (!plan) return res.status(500).json({ error: "Plan not found." });
  
//         const limit = Number(plan.permissions?.[requiredPermission]);
//         if (!limit || limit <= 0) {
//           return res.status(403).json({
//             error: `Your plan does not allow ${requiredPermission}.`,
//           });
//         }
  
//         // 3️⃣ Count usage
//         let currentCount = 0;
  
//         if (requiredPermission === "contacts") {
//           const data = await db
//             .select()
//             .from(contacts)
//             .leftJoin(channels, eq(contacts.channelId, channels.id))
//             .where(eq(channels.createdBy, userId));
//           currentCount = data.length;
//         }
  
//         // channels limit
//         if (requiredPermission === "channel") {
//           const data = await db
//             .select()
//             .from(channels)
//             .where(eq(channels.createdBy, userId));
//           currentCount = data.length;
//         }
  
//         // automation limit
//         if (requiredPermission === "automation") {
//           const data = await db
//             .select()
//             .from(automations)
//             .where(eq(automations.createdBy, userId));
//           currentCount = data.length;
//         }
  
//         // campaign limit
//         if (requiredPermission === "campaign") {
//           const data = await db
//             .select()
//             .from(campaigns)
//             .where(eq(campaigns.createdBy, userId));
//           currentCount = data.length;
//         }
  
//         // 4️⃣ Validate
//         if (currentCount >= limit) {
//           return res.status(403).json({
//             error: `You have reached the limit for ${requiredPermission}. Allowed: ${limit}`,
//           });
//         }
  
//         next();
//       } catch (err) {
//         console.error("Subscription check error:", err);
//         return res.status(500).json({ error: "Server error checking subscription." });
//       }
//     };
//   };
  



import { Request, Response, NextFunction } from "express";

/**
 * requireSubscription middleware
 * 
 * The platform is 100% Free Forever with unlimited access for all users!
 * Channels, contacts, automations, and campaigns are unlocked with zero restrictions.
 */
export const requireSubscription = (
    _requiredPermission: "channel" | "contacts" | "automation" | "campaign"
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionUser = (req.session as any)?.user;
            const siteId = req.body?.siteId;

            // Allow authenticated session users and public widgets without blocking
            if (sessionUser || siteId) {
                return next();
            }

            return res.status(401).json({ error: "Unauthorized" });
        } catch (err) {
            console.error("Subscription check bypassed:", err);
            return next();
        }
    };
};

