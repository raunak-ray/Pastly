import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: env.DB_URL,

  // maximum number of connections allowed per process
  max: 10,

  // close idle connections after 40s
  idleTimeoutMillis: 40_000,

  // wait at most 5 seconds to establish a connectionString
  connectionTimeoutMillis: 5_000,

  application_name: "pastly-api",
});

// Pool errors happen outside a request, so log them here.
pool.on("error", (error) => {
  logger.error({ err: error }, "postgres pool error");
});

export const db = drizzle({
  client: pool,
  schema,
});

export async function closePool() {
  await pool.end();
}
