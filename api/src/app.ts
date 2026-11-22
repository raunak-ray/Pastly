import express, { type Request, type Response } from "express";
import errorMiddleware from "./middleware/error.middleware";
import notFoundMiddleware from "./middleware/notFound.middleware";
import { getTimeStamp } from "./utils/helpers";
import { successResponse } from "./utils/responseHelpers";
import loggerMiddleware from "./middleware/logger.middleware";
import PasteRoutes from "@/modules/paste/paste.route";

const app = express();

// Logging runs first so body-parser errors still get a request id and log line.
app.use(loggerMiddleware);
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) =>
  successResponse(res, {
    statusCode: 200,
    message: "API is up and running",
    data: {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: getTimeStamp(),
    },
  }),
);

app.use("/", PasteRoutes);

// Unknown routes → 404, then every error gets formatted in one place.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
