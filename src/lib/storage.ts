import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

let cachedClient: S3Client | null = null;

export type ReceiptUploadInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export async function uploadReceiptToStorage(input: ReceiptUploadInput) {
  const client = getS3Client();
  const config = getStorageConfig();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    bucket: config.bucket,
    key: input.key,
  };
}

export async function deleteReceiptFromStorage(key: string) {
  const client = getS3Client();
  const config = getStorageConfig();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}

export async function getReceiptFromStorage(key: string) {
  const client = getS3Client();
  const config = getStorageConfig();
  const output = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );

  if (!output.Body) {
    throw new Error("Receipt object body is empty.");
  }

  return {
    body: toWebStream(output.Body),
    contentType: output.ContentType ?? "application/octet-stream",
    contentLength: typeof output.ContentLength === "number" ? output.ContentLength : undefined,
  };
}

function getS3Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getStorageConfig();
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });

  return cachedClient;
}

function toWebStream(body: unknown): ReadableStream<Uint8Array> {
  if (isSdkBodyWithTransform(body)) {
    return body.transformToWebStream();
  }

  if (body instanceof Readable) {
    return Readable.toWeb(body) as ReadableStream<Uint8Array>;
  }

  throw new Error("Unsupported S3 body stream type.");
}

function isSdkBodyWithTransform(value: unknown): value is { transformToWebStream: () => ReadableStream<Uint8Array> } {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "transformToWebStream" in value && typeof (value as { transformToWebStream?: unknown }).transformToWebStream === "function";
}

function getStorageConfig() {
  const endpoint = requiredEnv("S3_ENDPOINT");
  const region = requiredEnv("S3_REGION");
  const bucket = requiredEnv("S3_BUCKET");
  const accessKey = requiredEnv("S3_ACCESS_KEY");
  const secretKey = requiredEnv("S3_SECRET_KEY");
  const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE ?? "true").trim().toLowerCase() !== "false";

  return {
    endpoint,
    region,
    bucket,
    accessKey,
    secretKey,
    forcePathStyle,
  };
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for S3 storage.`);
  }

  return value;
}
