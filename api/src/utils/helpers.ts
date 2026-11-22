import { env } from "@/config/env";
import { Snowflake } from "./snowflake";

const snowflake = new Snowflake(env.WORKER_ID);

export function getTimeStamp(): string {
  return new Date().toISOString();
}

export function getPasteCode(): string {
  const id = snowflake.generate();
  return snowflake.encode(id);
}
