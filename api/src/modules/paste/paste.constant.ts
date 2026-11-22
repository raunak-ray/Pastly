import { DrizzleQueryError } from "drizzle-orm";

export const EXPIRES_TIME_MS = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
} as const;

export const MAX_ATTEMPTS = 5 as const;

// Drizzle wraps driver errors, so the pg code lives on cause. Only retry
// when the paste-code unique index is the one that failed.
export function isPasteConflict(error: unknown): boolean {
  if (!(error instanceof DrizzleQueryError)) return false;

  const cause = error.cause;

  if (!cause || !("code" in cause) || !("constraint" in cause)) return false;

  return cause.code === "23505" && cause.constraint === "idx_paste_code";
}
