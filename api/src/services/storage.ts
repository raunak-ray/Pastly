import {
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { r2 } from "@/config/r2";
import { ConflictError, NotFoundError } from "@/utils/AppError";

interface UploadFileData {
  content: string;
  language: string;
  expires_at: Date;
  title?: string;
}

// IfNoneMatch makes this create-only: R2 returns 412 when the key exists,
// which the service treats as a code collision.
export async function uploadFile(
  key: string,
  { content, language, title, expires_at }: UploadFileData,
) {
  try {
    const res = await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: `pastes/${key}.txt`,
        Body: content,
        ContentType: "text/plain; charset=utf-8",
        ContentDisposition: "inline",
        IfNoneMatch: "*",
        Metadata: {
          language: language.toLowerCase(),
          expires_at: expires_at.toISOString(),
          ...(title && { title }),
        },
      }),
    );

    return {
      key,
      etag: res.ETag,
    };
  } catch (error) {
    if (
      error instanceof S3ServiceException &&
      error.$metadata.httpStatusCode === 412
    ) {
      throw new ConflictError("Paste code already exists");
    }

    // Error middleware logs this and returns a generic 500.
    throw error;
  }
}

export async function getFile(key: string) {
  try {
    const res = await r2.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: `pastes/${key}.txt`,
      }),
    );

    const content = await res.Body?.transformToString("utf-8");

    return {
      content: content ?? "",
      contentType: res.ContentType,
      language: res.Metadata?.language,
      title: res.Metadata?.title,
    };
  } catch (error) {
    if (
      error instanceof S3ServiceException &&
      error.$metadata.httpStatusCode === 404
    ) {
      throw new NotFoundError("Paste content not found");
    }

    throw error;
  }
}
