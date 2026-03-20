import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { createServiceLogger } from '../logger';

const log = createServiceLogger('storage');

const s3 = new S3Client({
  endpoint: config.storj.endpoint,
  region: 'us1',
  credentials: {
    accessKeyId: config.storj.accessKeyId,
    secretAccessKey: config.storj.secretAccessKey,
  },
  forcePathStyle: true,
});

export type StoragePrefix = keyof typeof config.storj.prefixes;

function fullKey(prefix: StoragePrefix, objectKey: string): string {
  return `${config.storj.prefixes[prefix]}/${objectKey}`;
}

export async function getPresignedUrl(prefix: StoragePrefix, objectKey: string, downloadFilename?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.storj.bucket,
    Key: fullKey(prefix, objectKey),
    ...(downloadFilename && {
      ResponseContentDisposition: `attachment; filename="${downloadFilename.replace(/["\\\r\n]/g, '_')}"`,
    }),
  });
  return getSignedUrl(s3, command, { expiresIn: config.storj.presignExpiry });
}

export async function getUploadUrl(prefix: StoragePrefix, objectKey: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.storj.bucket,
    Key: fullKey(prefix, objectKey),
  });
  return getSignedUrl(s3, command, { expiresIn: config.storj.presignExpiry });
}

export async function initiateMultipartUpload(prefix: StoragePrefix, objectKey: string): Promise<string> {
  const key = fullKey(prefix, objectKey);
  const { UploadId } = await s3.send(new CreateMultipartUploadCommand({
    Bucket: config.storj.bucket,
    Key: key,
  }));
  log.info({ key, uploadId: UploadId }, 'Initiated multipart upload');
  return UploadId!;
}

export async function getMultipartPartUrl(
  prefix: StoragePrefix,
  objectKey: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  const command = new UploadPartCommand({
    Bucket: config.storj.bucket,
    Key: fullKey(prefix, objectKey),
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(s3, command, { expiresIn: config.storj.presignExpiry });
}

export async function completeMultipartUpload(
  prefix: StoragePrefix,
  objectKey: string,
  uploadId: string,
  parts: { part: number; etag: string }[],
): Promise<void> {
  const key = fullKey(prefix, objectKey);
  await s3.send(new CompleteMultipartUploadCommand({
    Bucket: config.storj.bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((p) => ({ PartNumber: p.part, ETag: p.etag })),
    },
  }));
  log.info({ key, uploadId }, 'Completed multipart upload');
}

export async function abortMultipartUpload(
  prefix: StoragePrefix,
  objectKey: string,
  uploadId: string,
): Promise<void> {
  const key = fullKey(prefix, objectKey);
  await s3.send(new AbortMultipartUploadCommand({
    Bucket: config.storj.bucket,
    Key: key,
    UploadId: uploadId,
  }));
  log.info({ key, uploadId }, 'Aborted multipart upload');
}

export async function deleteObject(prefix: StoragePrefix, objectKey: string): Promise<void> {
  const key = fullKey(prefix, objectKey);
  await s3.send(new DeleteObjectCommand({
    Bucket: config.storj.bucket,
    Key: key,
  }));
  log.info({ key }, 'Deleted object');
}

export { s3 };
