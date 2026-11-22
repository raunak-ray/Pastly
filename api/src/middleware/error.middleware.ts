import type { NextFunction, Request, Response } from "express";
import { logger } from "@/config/logger";
import { AppError, BadRequestError } from "../utils/AppError";
import { errorResponse } from "../utils/responseHelpers";

// Express recognizes an error handler by its four parameters.
export default function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  // Fallback for errors thrown before pino-http runs.
  const log = req.log ?? logger;

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      log.error(
        { err: error, code: error.code, statusCode: error.statusCode },
        "request failed",
      );
    } else {
      // 4xx is expected; keep it out of normal logs.
      log.debug(
        { code: error.code, statusCode: error.statusCode },
        "request rejected",
      );
    }

    return errorResponse(res, {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      fields: error instanceof BadRequestError ? error.fields : undefined,
    });
  }

  log.error(
    { err: error instanceof Error ? error : new Error(String(error)) },
    "unhandled request error",
  );

  // Don't leak SQL/storage details to the client.
  return errorResponse(res, {
    statusCode: 500,
    message: "Internal server error",
  });
}
