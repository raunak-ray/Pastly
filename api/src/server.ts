import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { closePool } from "@/db/config";
import app from "./app";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "server started");
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, "shutting down");

  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, "error closing http server");
    }

    try {
      await closePool();
    } catch (error) {
      logger.error({ err: error }, "error closing postgres pool");
    }

    logger.flush();
    process.exit(error ? 1 : 0);
  });

  // Do not hang forever if a connection refuses to close.
  setTimeout(() => {
    logger.error("shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error(
    { err: reason instanceof Error ? reason : new Error(String(reason)) },
    "unhandled rejection",
  );
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "uncaught exception");
  process.exit(1);
});
