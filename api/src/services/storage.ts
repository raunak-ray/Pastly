import {
  GetObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { r2 } from "@/config/r2";
import { AppError } from "@/utils/AppError";

interface UploadFileData {
  content: string;
  language: string;
  title?: string;
}

export async function uploadFile(
  key: string,
  { content, language, title }: UploadFileData,
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
      throw new AppError("Paste already exists");
    }
    console.error("Error while uploading to Cloudflare R2:", error);

    throw new AppError(
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file",
    );
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

    // console.log(res);
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
      throw new AppError("Paste not found");
    }
    console.error(`Failed to get file from cloudfare R2: `, error);

    throw new AppError(
      `Failed to get file from cloudfare R2: ${error instanceof Error ? error.message : ""}`,
    );
  }
}
