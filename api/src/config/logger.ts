import { S3ServiceException } from "@aws-sdk/client-s3";
import { DrizzleQueryError } from "drizzle-orm";
import { pino } from "pino";
import { AppError } from "@/utils/AppError";
import { env } from "./env";

// Drizzle puts the SQL and its params in the error message, and the params
// include paste content. Never log the raw error.
export function safeErrorSerializer(error: Error) {
  if (error instanceof DrizzleQueryError) {
    const cause = error.cause as
      | { code?: string; constraint?: string }
      | undefined;

    return {
      type: "DrizzleQueryError",
      message: "Database query failed",
      code: cause?.code,
      constraint: cause?.constraint,
    };
  }

  if (error instanceof AppError) {
    return {
      type: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // SDK stack traces are just noise here.
  if (error instanceof S3ServiceException) {
    return {
      type: error.name,
      message: error.message,
      httpStatusCode: error.$metadata.httpStatusCode,
    };
  }

  return pino.stdSerializers.err(error);
}

// Request fields are trimmed in logger.middleware.ts. base: null removes
// pid/hostname, and level is printed as "info" instead of 30.
export const logger = pino({
  level: env.LOG_LEVEL,
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    err: safeErrorSerializer,
  },
  redact: {
    // Safety net in case a serializer changes later.
    paths: ["req.headers.authorization", "req.headers.cookie", "req.body"],
    remove: true,
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            // Keep ANSI colors out of redirected/piped logs.
            colorize: Boolean(process.stdout.isTTY),
            singleLine: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});
