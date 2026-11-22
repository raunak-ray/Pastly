import { AppError } from "./AppError";
import { Snowflake } from "./snowflake";
import "dotenv/config";

const WORKER_ID = process.env.WORKER_ID! || "1";
const snowflake = new Snowflake(Number(WORKER_ID));

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
