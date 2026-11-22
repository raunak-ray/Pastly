import { env } from "@/config/env";
import { AppError } from "./AppError";
import { Snowflake } from "./snowflake";

const snowflake = new Snowflake(env.WORKER_ID);

export function getTimeStamp(): string {
  return new Date().toISOString();
}

export function getPasteCode(): string {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const id = snowflake.generate();
      return snowflake.encode(id);
    } catch (error: unknown) {
      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new AppError("Failed to generate paste code");
}
