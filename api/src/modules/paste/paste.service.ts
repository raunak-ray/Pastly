import type { Logger } from "pino";
import { uploadFile } from "@/services/storage";
import { AppError, ConflictError } from "@/utils/AppError";
import { getPasteCode } from "@/utils/helpers";
import {
  EXPIRES_TIME_MS,
  isPasteConflict,
  MAX_ATTEMPTS,
} from "./paste.constant";
import { PasteRepository } from "./paste.repository";
import type { CreatePasteType } from "./paste.schema";

export class PasteService {
  private readonly pasteRepository: PasteRepository;

  constructor() {
    this.pasteRepository = new PasteRepository();
  }

  // Upload first so a DB row never points at missing content. Retry with a
  // new code if R2 or Postgres says the code is taken.
  async create(input: CreatePasteType, log: Logger) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const code = getPasteCode();

      if (!/^[0-9A-Za-z]{1,15}$/.test(code)) continue;

      const expires_at = new Date(
        Date.now() + EXPIRES_TIME_MS[input.expiresIn],
      );

      try {
        await uploadFile(code, {
          content: input.content,
          language: input.language,
          expires_at,
          title: input.title,
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          log.warn({ attempt }, "paste code collision in storage, retrying");
          continue;
        }

        // Error middleware logs unexpected failures.
        throw error;
      }

      try {
        const result = await this.pasteRepository.create({ ...input, code });

        log.info(
          { code: result.code, language: result.language },
          "paste created",
        );

        return { ...result, id: String(result.id) };
      } catch (error) {
        if (isPasteConflict(error)) {
          log.warn({ attempt }, "paste code collision in database, retrying");
          continue;
        }

        throw error;
      }
    }

    throw new AppError("Failed to create the paste");
  }
}
