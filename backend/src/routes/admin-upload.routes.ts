import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { s3 } from '../services/storage.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { asyncHandler } from '../middleware/async-handler';
import { config } from '../config';
import { createServiceLogger } from '../logger';
import sharp from 'sharp';

const log = createServiceLogger('admin-upload');

export const adminUploadRoutes = Router();
adminUploadRoutes.use(authMiddleware);
adminUploadRoutes.use(adminMiddleware);

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB raw upload limit
const RESIZE_WIDTH = 1920;
const WEBP_QUALITY = 82;

// Upload and resize a preview image for a specific asset
adminUploadRoutes.put('/media/assets/:assetId/upload', asyncHandler(async (req, res) => {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: req.params.assetId as string },
  });
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }

  const body = req.body as Buffer;
  if (!body || body.length === 0) {
    res.status(400).json({ error: 'No image data received' });
    return;
  }

  // Resize and convert to WebP
  const resized = await sharp(body)
    .resize(RESIZE_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Upload to Storj
  const key = `${config.storj.prefixes.previewImages}/${asset.objectKey}`;
  await s3.send(new PutObjectCommand({
    Bucket: config.storj.bucket,
    Key: key,
    Body: resized,
    ContentType: 'image/webp',
  }));

  log.info(
    { assetId: asset.id, originalSize: body.length, resizedSize: resized.length },
    'Uploaded resized preview image',
  );

  res.json({
    assetId: asset.id,
    originalSize: body.length,
    resizedSize: resized.length,
  });
}));
