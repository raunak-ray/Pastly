import { env } from "@/config/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  strict: true,
  out: "./src/db/migrations",
  schema: "./src/db/schema/index.*",
  dialect: "postgresql",
  casing: "snake_case",
  verbose: true,
  dbCredentials: {
    url: env.DB_URL,
  },
});
