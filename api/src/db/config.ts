import { env } from "@/config/env";
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

// Log unexpected errors on idle connections
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export const db = drizzle({
  client: pool,
  schema,
});
