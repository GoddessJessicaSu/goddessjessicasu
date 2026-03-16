import { Client } from 'minio';
import { config } from '../config';
import { createServiceLogger } from '../logger';

const log = createServiceLogger('minio');

const minioClient = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: false,
  accessKey: config.minio.rootUser,
  secretKey: config.minio.rootPassword,
});

export type MinioBucket = keyof typeof config.minio.buckets;

// Rewrite internal minio URLs to the public-facing proxy URL
function toPublicUrl(internalUrl: string): string {
  if (!config.minio.publicUrl) return internalUrl;
  const parsed = new URL(internalUrl);
  // internalUrl: http://minio:9000/bucket/key?signature...
  // publicUrl:   https://goddessjessicasu.art/minio/bucket/key?signature...
  return `${config.minio.publicUrl}${parsed.pathname}${parsed.search}`;
}

export async function ensureBuckets() {
  for (const [key, bucketName] of Object.entries(config.minio.buckets)) {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
    }
    log.info({ bucket: bucketName }, 'Bucket ensured');
  }
  log.info('All buckets ensured');
}

export async function getPresignedUrl(bucket: MinioBucket, objectKey: string): Promise<string> {
  const url = await minioClient.presignedGetObject(
    config.minio.buckets[bucket],
    objectKey,
    config.minio.presignExpiry
  );
  return toPublicUrl(url);
}

export async function getUploadUrl(bucket: MinioBucket, objectKey: string): Promise<string> {
  const url = await minioClient.presignedPutObject(
    config.minio.buckets[bucket],
    objectKey,
    config.minio.presignExpiry
  );
  return toPublicUrl(url);
}

export async function initiateMultipartUpload(bucket: MinioBucket, objectKey: string): Promise<string> {
  const bucketName = config.minio.buckets[bucket];
  const uploadId = await minioClient.initiateNewMultipartUpload(bucketName, objectKey, {});
  log.info({ bucket: bucketName, objectKey, uploadId }, 'Initiated multipart upload');
  return uploadId;
}

export async function getMultipartPartUrl(
  bucket: MinioBucket,
  objectKey: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  const bucketName = config.minio.buckets[bucket];
  // Build presigned PUT URL with uploadId and partNumber query params
  const url = await minioClient.presignedUrl(
    'PUT',
    bucketName,
    objectKey,
    config.minio.presignExpiry,
    { uploadId, partNumber: String(partNumber) },
  );
  return toPublicUrl(url);
}

export async function completeMultipartUpload(
  bucket: MinioBucket,
  objectKey: string,
  uploadId: string,
  parts: { part: number; etag: string }[],
): Promise<void> {
  const bucketName = config.minio.buckets[bucket];
  await (minioClient as any).completeMultipartUpload(bucketName, objectKey, uploadId, parts);
  log.info({ bucket: bucketName, objectKey, uploadId }, 'Completed multipart upload');
}

export async function abortMultipartUpload(
  bucket: MinioBucket,
  objectKey: string,
  uploadId: string,
): Promise<void> {
  const bucketName = config.minio.buckets[bucket];
  await (minioClient as any).abortMultipartUpload(bucketName, objectKey, uploadId);
  log.info({ bucket: bucketName, objectKey, uploadId }, 'Aborted multipart upload');
}

export async function deleteObject(bucket: MinioBucket, objectKey: string): Promise<void> {
  const bucketName = config.minio.buckets[bucket];
  await minioClient.removeObject(bucketName, objectKey);
  log.info({ bucket: bucketName, objectKey }, 'Deleted object');
}

export { minioClient };
