import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { AppError } from "@/utils/AppError";

const DB_URL = process.env.DB_URL!;

if (!DB_URL) {
  throw new AppError("DB_URL is missing in env");
}

export default defineConfig({
  strict: true,
  out: "./src/db/migrations",
  schema: "./src/db/schema/index.*",
  dialect: "postgresql",
  casing: "snake_case",
  verbose: true,
  dbCredentials: {
    url: DB_URL,
  },
});
