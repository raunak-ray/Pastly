import {
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { r2 } from "@/config/r2";
import { ConflictError } from "@/utils/AppError";

interface UploadFileData {
  content: string;
  language: string;
  expires_at: Date;
  title?: string;
}

// S3 errors carry the HTTP status on $metadata.
function hasS3Status(error: unknown, statusCode: number): boolean {
  return (
    error instanceof S3ServiceException &&
    error.$metadata.httpStatusCode === statusCode
  );
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
    if (hasS3Status(error, 412)) {
      throw new ConflictError("Paste code already exists");
    }

    // Error middleware logs this and returns a generic 500.
    throw error;
  }
}

// Read a paste from R2. Returns null when the object is missing.
export async function getFile(key: string) {
  try {
    const res = await r2.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      }),
    );

    // An empty paste has an empty body, so default to "".
    const content = await res.Body?.transformToString("utf-8");

    return {
      content: content ?? "",
      contentType: res.ContentType,
      language: res.Metadata?.language,
      title: res.Metadata?.title,
    };
  } catch (error) {
    if (hasS3Status(error, 404)) return null;

    // Unexpected R2 failures are logged by the error middleware.
    throw error;
  }
}
