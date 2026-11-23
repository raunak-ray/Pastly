import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { inArray, lte } from "drizzle-orm";
import cron from "node-cron";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { r2 } from "@/config/r2";
import { db } from "@/db/config";
import { Paste } from "@/db/schema";

const BATCH_SIZE = 500 as const;

let isRunning = false;

// Delete expired pastes from R2 first, then remove their database rows.
export async function cleanupJob() {
  // Skip this run if the previous one is still busy.
  if (isRunning) {
    logger.warn("cleanup job skipped: previous run still in progress");
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    logger.info({ batchSize: BATCH_SIZE }, "cleanup job started");

    // Fetch one batch of expired paste rows.
    const dbRecords = await db
      .select()
      .from(Paste)
      .where(lte(Paste.expires_at, new Date()))
      .orderBy(Paste.id)
      .limit(BATCH_SIZE);

    if (dbRecords.length === 0) {
      logger.debug("cleanup job finished: no expired pastes found");
      return;
    }

    logger.info(
      { found: dbRecords.length },
      "cleanup job found expired pastes",
    );

    // Remove the matching R2 objects.
    const results = await r2.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET_NAME,
        Delete: {
          Objects: dbRecords.map((paste) => ({
            Key: paste.content_url,
          })),
          Quiet: false,
        },
      }),
    );

    // R2 reports failures per key; anything else was deleted.
    const failedKeys = new Set(
      (results.Errors ?? [])
        .map((error) => error.Key)
        .filter((key): key is string => Boolean(key)),
    );

    const deletedRecords = dbRecords.filter(
      (paste) => !failedKeys.has(paste.content_url),
    );

    if (failedKeys.size > 0) {
      logger.warn(
        { failed: failedKeys.size, keys: [...failedKeys] },
        "cleanup job failed to delete some R2 objects",
      );
    }

    logger.info(
      {
        deleted: deletedRecords.length,
        failed: failedKeys.size,
      },
      "cleanup job deleted R2 objects",
    );

    // Keep rows whose R2 object is still there, so the next run retries them.
    if (deletedRecords.length > 0) {
      await db.delete(Paste).where(
        inArray(
          Paste.id,
          deletedRecords.map((paste) => paste.id),
        ),
      );

      logger.info(
        { deleted: deletedRecords.length },
        "cleanup job deleted database rows",
      );
    }

    logger.info(
      {
        found: dbRecords.length,
        deleted: deletedRecords.length,
        failed: failedKeys.size,
        durationMs: Date.now() - startedAt,
      },
      "cleanup job completed",
    );

    if (dbRecords.length === BATCH_SIZE) {
      logger.info(
        { batchSize: BATCH_SIZE },
        "cleanup job reached batch limit; remaining rows will run next time",
      );
    }
  } catch (error) {
    // The `err` key uses the safe serializer configured in logger.ts.
    logger.error(
      { err: error, durationMs: Date.now() - startedAt },
      "cleanup job failed",
    );
  } finally {
    isRunning = false;
  }
}

// Start the cleanup cron. Called once when the server starts.
export function startCleanupWorker() {
  cron.schedule("0 */12 * * *", cleanupJob, { timezone: "UTC" });

  logger.info(
    { schedule: "0 */12 * * *", timezone: "UTC", batchSize: BATCH_SIZE },
    "cleanup worker started",
  );
}
