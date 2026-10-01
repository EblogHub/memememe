import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET;
const storageReady = Boolean(bucket && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
const client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT || "http://127.0.0.1:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "not-configured",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "not-configured"
  }
});

export function requireStorage() {
  if (!storageReady) {
    const error = new Error("Private file storage is not configured. Set the S3 environment variables.");
    error.status = 503;
    throw error;
  }
}

export async function putPrivateObject(key, file) {
  requireStorage();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentLength: file.size,
    ContentType: file.mimetype
  }));
  return key;
}

export async function deletePrivateObject(key) {
  if (!storageReady || !key) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function createPrivateObjectUrl(key, expiresIn = 300) {
  requireStorage();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export function isStorageReady() {
  return storageReady;
}
