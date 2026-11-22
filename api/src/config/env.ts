import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  WORKER_ID: z.coerce.number().int().min(0).max(1023),

  DB_URL: z.url(),

  R2_ACCOUNT_ID: z.string().nonempty(),
  R2_ACCESS_KEY_ID: z.string().nonempty(),
  R2_SECRET_ACCESS_KEY: z.string().nonempty(),
  R2_BUCKET_NAME: z.string().nonempty(),
  R2_ENDPOINT: z.url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // The logger imports `env`, so it cannot be used before validation succeeds.
  console.error("\n❌ Invalid environment variables:\n");
  console.error(z.prettifyError(result.error));
  console.error("\nCheck your .env file.\n");
  process.exit(1);
}

export const env = Object.freeze(result.data);
