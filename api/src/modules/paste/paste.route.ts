import { Router } from "express";
import { PasteController } from "./paste.controller";
import { validate } from "@/middleware/validation.middleware";
import { createPasteSchema, getPasteSchema } from "./paste.schema";

const router = Router();

const pasteController = new PasteController();

router.get("/:code", validate(getPasteSchema, "params"), pasteController.getPaste);
router.post("/", validate(createPasteSchema), pasteController.createPaste);

export default router;
