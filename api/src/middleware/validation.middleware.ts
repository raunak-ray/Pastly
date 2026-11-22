import { BadRequestError } from "@/utils/AppError";
import type { FieldError } from "@/utils/responseHelpers";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

type ValidationType = "body" | "params" | "query";

export function validate<T extends z.ZodType>(
  schema: T,
  type: ValidationType = "body",
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[type]);

    if (!result.success) {
      const fields: FieldError[] = result.error.issues.map((issue) => ({
        field: issue.path.join(", "),
        message: issue.message,
      }));

      return next(new BadRequestError("Validation failed", fields));
    }

    req[type] = result.data;

    next();
  };
}
