import type { Request, Response } from "express";
import { PasteService } from "./paste.service";
import type { CreatePasteType, GetPasteType } from "./paste.schema";
import { successResponse } from "@/utils/responseHelpers";

export class PasteController {
  private readonly pasteService: PasteService;

  constructor() {
    this.pasteService = new PasteService();
  }

  getPaste = async (req: Request<GetPasteType>, res: Response) => {
    const data = await this.pasteService.get(req.params, req.log);

    return successResponse(res, {
      data,
      statusCode: 200,
      message: "Paste retrieved successfully",
    });
  };

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
