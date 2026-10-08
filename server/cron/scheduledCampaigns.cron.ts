import cron from "node-cron";
import { diployLogger, HTTP_STATUS, DIPLOY_BRAND } from "@diploy/core";
import { storage } from "../storage";
import { startCampaignExecution } from "../controllers/campaigns.controller";
import { db } from "../db";
import { campaigns as campaignsTable, messageQueue } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { abandonedCartReminderService } from "../services/ecommerce/abandoned-cart-reminder.service";

// ─── Retry helper for transient DB errors ───
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function isTransientDbError(err: any): boolean {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("connection terminated") ||
    msg.includes("connection timeout") ||
    msg.includes("connection refused") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("pool is draining") ||
    msg.includes("client has encountered a connection error") ||
    msg.includes("unable to connect") ||
    msg.includes("timeout expired")
  );
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isTransientDbError(err)) {
        console.warn(
          `[ScheduledCron] Transient DB error during ${label} (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAY_MS}ms...`,
          (err as Error)?.message,
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// ─── Overlap guard — skip this tick if the previous one is still running ───
let campaignTickRunning = false;
let cartTickRunning = false;

// ⏰ Runs every minute
export function startScheduledCampaignCron() {
  cron.schedule("* * * * *", async () => {
    if (campaignTickRunning) {
      console.warn("[ScheduledCron] Previous campaign tick still running — skipping this tick.");
      return;
    }
    campaignTickRunning = true;
    try {
      const now = new Date();

      // Find campaigns whose scheduled time has arrived and are still in "scheduled" state
      const campaigns = await withRetry(
        () => storage.getScheduledCampaigns(now),
        "getScheduledCampaigns",
      );

      if (campaigns.length > 0) {
        console.log(`[ScheduledCron] Found ${campaigns.length} campaign(s) to start`);
      }

      for (const campaign of campaigns) {
        try {
          console.log(`[ScheduledCron] Starting campaign ${campaign.id} ("${campaign.name}") scheduled for ${campaign.scheduledAt?.toISOString()}`);

          await storage.updateCampaign(campaign.id, { status: "active" });

          const updated = await storage.getCampaign(campaign.id);
          if (!updated || updated.status !== "active") {
            console.error(`[ScheduledCron] Campaign ${campaign.id} failed to transition to active (current status: ${updated?.status ?? "not found"})`);
            continue;
          }

          void startCampaignExecution(campaign.id).catch((err) => {
            console.error(`[ScheduledCron] Error starting campaign ${campaign.id}:`, err);
            storage.updateCampaign(campaign.id, { status: "failed" }).catch(() => {});
          });

          console.log(`[ScheduledCron] Campaign ${campaign.id} started OK`);
        } catch (campaignError) {
          console.error(`[ScheduledCron] Error starting campaign ${campaign.id}:`, campaignError);
        }
      }

      try {
        const orphanedQueued = await withRetry(
          () => db
            .select()
            .from(campaignsTable)
            .where(
              sql`
                ${campaignsTable.status} = 'queued'
                AND ${campaignsTable.updatedAt} < NOW() - INTERVAL '3 minutes'
                AND (
                  ${campaignsTable.populationStartedAt} IS NULL
                  OR ${campaignsTable.populationStartedAt} < NOW() - INTERVAL '15 minutes'
                )
                AND NOT EXISTS (
                  SELECT 1 FROM ${messageQueue}
                  WHERE ${messageQueue.campaignId} = ${campaignsTable.id}
                )
                AND (${campaignsTable.platform} IS NULL OR ${campaignsTable.platform} != 'email')
                AND (${campaignsTable.campaignType} IS NULL OR ${campaignsTable.campaignType} != 'email')
                AND (${campaignsTable.apiType} IS NULL OR ${campaignsTable.apiType} != 'email_api')
              `
            ),
          "orphaned-queued select",
        );

        for (const campaign of orphanedQueued) {
          try {
            console.log(`[ScheduledCron] Recovering orphaned-queued campaign: ${campaign.id} ("${campaign.name}")`);
            await storage.updateCampaign(campaign.id, { status: "active" });
            void startCampaignExecution(campaign.id).catch((err) => {
              console.error(`[ScheduledCron] Error recovering orphaned campaign ${campaign.id}:`, err);
              storage.updateCampaign(campaign.id, { status: "failed" }).catch(() => {});
            });
          } catch (err) {
            console.error(`[ScheduledCron] Error during orphan-queued recovery for campaign ${campaign.id}:`, err);
          }
        }
      } catch (err) {
        console.error("[ScheduledCron] Error during orphan-queued safety net:", err);
      }

      // ─── Safety net 2: recover campaigns stuck in "sending" with all messages done ───
      // Handles cases where checkCampaignCompletions was skipped (e.g. server restart
      // mid-batch) leaving the campaign in "sending" forever even though every queued
      // message is already in a terminal state (sent / failed).
      try {
        const orphanedSending = await withRetry(
          () => db
            .select()
            .from(campaignsTable)
            .where(
              sql`
                ${campaignsTable.status} = 'sending'
                AND ${campaignsTable.updatedAt} < NOW() - INTERVAL '10 minutes'
                AND NOT EXISTS (
                  SELECT 1 FROM ${messageQueue}
                  WHERE ${messageQueue.campaignId} = ${campaignsTable.id}
                    AND ${messageQueue.status} NOT IN ('sent', 'failed')
                )
                AND EXISTS (
                  SELECT 1 FROM ${messageQueue}
                  WHERE ${messageQueue.campaignId} = ${campaignsTable.id}
                )
              `
            ),
          "orphaned-sending select",
        );

        for (const campaign of orphanedSending) {
          try {
            // Query fresh terminal-message counts from message_queue to determine outcome
            const [counts] = await withRetry(
              () => db
                .select({
                  sentCount:   sql<number>`COUNT(*) FILTER (WHERE ${messageQueue.status} = 'sent')`,
                  failedCount: sql<number>`COUNT(*) FILTER (WHERE ${messageQueue.status} = 'failed')`,
                })
                .from(messageQueue)
                .where(eq(messageQueue.campaignId, campaign.id)),
              `message counts for campaign ${campaign.id}`,
            );

            const sentCount   = Number(counts?.sentCount   ?? 0);
            const failedCount = Number(counts?.failedCount ?? 0);

            // Mark "failed" only if nothing was sent at all; otherwise "completed"
            const finalStatus = sentCount === 0 && failedCount > 0 ? "failed" : "completed";

            console.log(`[ScheduledCron] Recovering orphaned-sending campaign ${campaign.id} ("${campaign.name}") — sent: ${sentCount}, failed: ${failedCount} → marking ${finalStatus}`);
            await storage.updateCampaign(campaign.id, {
              status: finalStatus,
              completedAt: new Date(),
              ...(sentCount > 0   ? { sentCount }   : {}),
              ...(failedCount > 0 ? { failedCount } : {}),
            });
          } catch (err) {
            console.error(`[ScheduledCron] Error during orphan-sending recovery for campaign ${campaign.id}:`, err);
          }
        }
      } catch (err) {
        console.error("[ScheduledCron] Error during orphan-sending safety net:", err);
      }
      // ─── Safety net 3: fail message_queue rows for campaigns paused too long ───
      // Without this sweeper, a campaign that the user paused and never resumed
      // would leave its queued messages sitting in the DB forever. After the
      // threshold below, mark them failed with reason `paused_too_long` and
      // bump the campaign's failedCount accordingly.
      try {
        const PAUSED_TOO_LONG_DAYS = parseInt(process.env.CAMPAIGN_PAUSED_TOO_LONG_DAYS || "7", 10);
        const sweepResult = await withRetry(
          () => db.execute(sql`
            WITH stale AS (
              SELECT mq.id, mq.campaign_id
              FROM ${messageQueue} mq
              JOIN ${campaignsTable} c ON c.id = mq.campaign_id
              WHERE mq.status = 'queued'
                AND c.status = 'paused'
                AND c.updated_at < NOW() - (${PAUSED_TOO_LONG_DAYS} || ' days')::interval
            ),
            updated AS (
              UPDATE ${messageQueue} mq
              SET status = 'failed',
                  error_code = 'paused_too_long',
                  error_message = 'Campaign was paused for more than ' || ${PAUSED_TOO_LONG_DAYS} || ' days'
              FROM stale
              WHERE mq.id = stale.id
              RETURNING mq.campaign_id
            ),
            counts AS (
              SELECT campaign_id, COUNT(*)::int AS failed_added
              FROM updated
              GROUP BY campaign_id
            )
            UPDATE ${campaignsTable} c
            SET failed_count = COALESCE(c.failed_count, 0) + counts.failed_added
            FROM counts
            WHERE c.id = counts.campaign_id
            RETURNING c.id, counts.failed_added
          `),
          "paused-too-long sweep",
        );

        const rows = (sweepResult as any).rows ?? [];
        for (const row of rows) {
          console.log(`[ScheduledCron] Paused-too-long sweep: campaign ${row.id} — failed ${row.failed_added} idle queued message(s)`);
        }
      } catch (err) {
        console.error("[ScheduledCron] Error during paused-too-long sweep:", err);
      }
    } catch (error) {
      console.error("[ScheduledCron] Unhandled error in scheduled campaigns cron:", error);
    } finally {
      campaignTickRunning = false;
    }
  });


  cron.schedule("* * * * *", async () => {
    if (cartTickRunning) {
      console.warn("[abandoned_cart] Previous reminder tick still running — skipping this tick.");
      return;
    }
    cartTickRunning = true;
    try {
      console.log("Node Time:", new Date());
      await abandonedCartReminderService.processPendingReminders();
    } catch (err) {
      console.error("[abandoned_cart] Scheduled cron tick failed:", err);
    } finally {
      cartTickRunning = false;
    }
  });
}
