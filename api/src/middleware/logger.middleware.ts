import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pinoHttp } from "pino-http";
import { logger, safeErrorSerializer } from "@/config/logger";

// One line per request: id, method, url, status and response time.
// Bodies and headers stay out of logs.
const httpLogger = pinoHttp({
  logger,
  // Keep serializers unwrapped so they receive the raw req/res/error.
  wrapSerializers: false,
  genReqId(req: IncomingMessage, res: ServerResponse) {
    const incoming = req.headers["x-request-id"];
    const id =
      typeof incoming === "string" && /^[\w-]{1,100}$/.test(incoming)
        ? incoming
        : randomUUID();

    res.setHeader("X-Request-Id", id);

    return id;
  },
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage() {
    return "request completed";
  },
  customErrorMessage() {
    return "request failed";
  },
  // pino-http adds a fake 500 error here; the real one is logged by error.middleware.
  customErrorObject(_req, _res, _error, val) {
    return {
      res: val.res,
      responseTime: val.responseTime,
    };
  },
  serializers: {
    err: safeErrorSerializer,
    req(req: IncomingMessage) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
    res(res: ServerResponse) {
      return { statusCode: res.statusCode };
    },
  },
});

export default httpLogger;
