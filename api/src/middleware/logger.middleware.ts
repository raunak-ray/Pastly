import type { NextFunction, Request, Response } from "express";
import { getTimeStamp } from "@/utils/helpers";

export default function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const method = req.method;
  const url = req.originalUrl;
  const start = new Date().getMilliseconds();
  const timestamp = getTimeStamp();

  console.log(`[${timestamp}] [Request] ${method} ${url}`);

  res.on("close", () => {
    if (res.statusCode >= 400) return;

    const now = new Date().getMilliseconds();
    const duration = now - start;

    console.log(`[${timestamp}] [Response] ${method} ${url} - ${duration} ms`);
  });

  next();
}
