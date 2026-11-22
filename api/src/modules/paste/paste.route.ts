import { Router } from "express";
import { PasteController } from "./paste.controller";
import { validate } from "@/middleware/validation.middleware";
import { createPasteSchema } from "./paste.schema";

const router = Router();

const pasteController = new PasteController();

router.post("/", validate(createPasteSchema), pasteController.createPaste);

export default router;
