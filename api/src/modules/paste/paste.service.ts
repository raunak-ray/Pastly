import type { Logger } from "pino";
import { getFile, uploadFile } from "@/services/storage";
import { AppError, ConflictError, NotFoundError } from "@/utils/AppError";
import { getPasteCode } from "@/utils/helpers";
import {
  EXPIRES_TIME_MS,
  isPasteConflict,
  MAX_ATTEMPTS,
} from "./paste.constant";
import { PasteRepository } from "./paste.repository";
import type { CreatePasteType, GetPasteType } from "./paste.schema";

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

  // Look up the paste row, then read its content from R2.
  async get(input: GetPasteType, log: Logger) {
    const data = await this.pasteRepository.get(input.code);
    console.log(data)

    // Unknown or expired codes are a normal 404.
    if (data === null) {
      log.debug({ code: input.code }, "paste not found");
      throw new NotFoundError("Requested paste was not found");
    }

    const objectData = await getFile(data.content_url);

    // The row exists but its R2 object is missing.
    if (objectData === null) {
      log.error({ code: data.code }, "paste content missing from storage");
      throw new NotFoundError("Paste content not found");
    }

    log.info({ code: data.code }, "paste retrieved");

    return {
      id: String(data.id),
      language: data.language,
      content: objectData.content,
      title: data.title,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    };
  }
}
