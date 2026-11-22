import type { Request, Response } from "express";
import { PasteService } from "./paste.service";
import type { CreatePasteType } from "./paste.schema";
import { successResponse } from "@/utils/responseHelpers";

export class PasteController {
  private readonly pasteService: PasteService;

  constructor() {
    this.pasteService = new PasteService();
  }

  createPaste = async (req: Request, res: Response) => {
    const input: CreatePasteType = req.body;

    const data = await this.pasteService.create(input, req.log);

    return successResponse(res, {
      data,
      statusCode: 201,
      message: "Paste created successfully",
    });
  };
}
