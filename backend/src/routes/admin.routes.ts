import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import {
  getUploadUrl,
  initiateMultipartUpload,
  getMultipartPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  deleteObject,
} from '../services/minio.service';
import { asyncHandler } from '../middleware/async-handler';
import crypto from 'crypto';

export const adminRoutes = Router();
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

// --- Media Management ---

const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB per part

// Create media entry + get upload URLs
adminRoutes.post('/media', asyncHandler(async (req, res) => {
  const { title, description, priceTokens, productFile, previewClip, previewImageCount = 1 } = req.body;

  if (!title || priceTokens == null || !productFile?.name || !productFile?.size || !productFile?.mimeType) {
    res.status(400).json({ error: 'title, priceTokens, and productFile (name, size, mimeType) required' });
    return;
  }

  const count = Math.max(1, Math.min(previewImageCount, 10));
  const hasPreviewClip = previewClip?.name && previewClip?.size && previewClip?.mimeType;

  const media = await prisma.media.create({
    data: {
      title,
      description: description || null,
      priceTokens,
      minioKey: crypto.randomUUID(),
      previewKey: hasPreviewClip ? crypto.randomUUID() : null,
      mimeType: productFile.mimeType,
      durationSecs: null,
      assets: {
        create: Array.from({ length: count }, (_, i) => ({
          objectKey: crypto.randomUUID(),
          sortOrder: i,
        })),
      },
    },
    include: { assets: { orderBy: { sortOrder: 'asc' } } },
  });

  // Product file upload — single or multipart
  let productUpload: any;
  if (productFile.size > MULTIPART_THRESHOLD) {
    const uploadId = await initiateMultipartUpload('products', media.minioKey);
    const totalParts = Math.ceil(productFile.size / CHUNK_SIZE);
    const partUrls = await Promise.all(
      Array.from({ length: totalParts }, (_, i) =>
        getMultipartPartUrl('products', media.minioKey, uploadId, i + 1).then(url => ({
          partNumber: i + 1,
          url,
        }))
      )
    );
    productUpload = { mode: 'multipart', uploadId, partUrls, chunkSize: CHUNK_SIZE };
  } else {
    const url = await getUploadUrl('products', media.minioKey);
    productUpload = { mode: 'single', url };
  }

  // Preview clip upload (optional)
  let previewClipUpload: { url: string } | undefined;
  if (hasPreviewClip && media.previewKey) {
    const url = await getUploadUrl('previewVideos', media.previewKey);
    previewClipUpload = { url };
  }

  // Preview image uploads
  const previewImageUploads = await Promise.all(
    media.assets.map(async (a) => ({
      assetId: a.id,
      url: await getUploadUrl('previewImages', a.objectKey),
      sortOrder: a.sortOrder,
    }))
  );

  res.json({ media, productUpload, previewClipUpload, previewImageUploads });
}));

// Complete multipart upload
adminRoutes.post('/media/:id/complete-multipart', asyncHandler(async (req, res) => {
  const { uploadId, parts } = req.body;
  if (!uploadId || !Array.isArray(parts)) {
    res.status(400).json({ error: 'uploadId and parts[] required' });
    return;
  }

  const mediaId = req.params.id as string;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const formattedParts = parts.map((p: { partNumber: number; etag: string }) => ({
    part: p.partNumber,
    etag: p.etag,
  }));

  await completeMultipartUpload('products', media.minioKey, uploadId, formattedParts);
  res.json({ message: 'Multipart upload completed' });
}));

// Abort multipart upload
adminRoutes.post('/media/:id/abort-multipart', asyncHandler(async (req, res) => {
  const { uploadId } = req.body;
  if (!uploadId) {
    res.status(400).json({ error: 'uploadId required' });
    return;
  }

  const mediaId = req.params.id as string;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  await abortMultipartUpload('products', media.minioKey, uploadId);
  res.json({ message: 'Multipart upload aborted' });
}));

// List all media
adminRoutes.get('/media', asyncHandler(async (_req, res) => {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { assets: true } } },
  });
  res.json({ media });
}));

// Update media
adminRoutes.put('/media/:id', asyncHandler(async (req, res) => {
  const { title, description, priceTokens, isPublished, durationSecs } = req.body;

  const media = await prisma.media.update({
    where: { id: req.params.id as string },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priceTokens !== undefined && { priceTokens }),
      ...(isPublished !== undefined && { isPublished }),
      ...(durationSecs !== undefined && { durationSecs }),
    },
  });

  res.json({ media });
}));

// Delete media
adminRoutes.delete('/media/:id', asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id as string },
    include: { assets: true },
  });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  // Delete from MinIO (best-effort — don't block DB deletion on storage failures)
  const deletions: Promise<void>[] = [];
  deletions.push(deleteObject('products', media.minioKey).catch(() => {}));
  if (media.previewKey) {
    deletions.push(deleteObject('previewVideos', media.previewKey).catch(() => {}));
  }
  for (const asset of media.assets) {
    deletions.push(deleteObject('previewImages', asset.objectKey).catch(() => {}));
  }
  await Promise.all(deletions);

  // Delete from DB (cascades to assets)
  await prisma.media.delete({ where: { id: media.id } });
  res.json({ message: 'Deleted' });
}));

// --- Users ---

adminRoutes.get('/users', asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      tokenBalance: true,
      createdAt: true,
      _count: { select: { purchases: true, transactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ users });
}));

adminRoutes.put('/users/:id', asyncHandler(async (req, res) => {
  const { tokenBalance } = req.body;
  if (tokenBalance == null || typeof tokenBalance !== 'number') {
    res.status(400).json({ error: 'tokenBalance (number) is required' });
    return;
  }
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id as string, 10) },
    data: { tokenBalance },
  });
  res.json({ user: { id: user.id, email: user.email, tokenBalance: user.tokenBalance } });
}));

// --- Transactions ---

adminRoutes.get('/transactions', asyncHandler(async (req, res) => {
  const { status, currency } = req.query;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(currency && { currency: currency as any }),
    },
    include: { user: { select: { email: true, username: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ transactions });
}));

// --- Site Config ---

adminRoutes.get('/config', asyncHandler(async (_req, res) => {
  let siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (!siteConfig) {
    siteConfig = await prisma.siteConfig.create({ data: { id: 1 } });
  }
  res.json({ config: siteConfig });
}));

// --- Token Tiers ---

adminRoutes.get('/tiers', asyncHandler(async (_req, res) => {
  const tiers = await prisma.tokenTier.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ tiers });
}));

adminRoutes.post('/tiers', asyncHandler(async (req, res) => {
  const { priceUsd, tokenAmount, sortOrder } = req.body;
  if (priceUsd == null || tokenAmount == null) {
    res.status(400).json({ error: 'priceUsd and tokenAmount required' });
    return;
  }
  const tier = await prisma.tokenTier.create({
    data: { priceUsd, tokenAmount, sortOrder: sortOrder ?? 0 },
  });
  res.json({ tier });
}));

adminRoutes.put('/tiers/:id', asyncHandler(async (req, res) => {
  const { priceUsd, tokenAmount, promoTokenAmount, isActive, sortOrder } = req.body;
  const tier = await prisma.tokenTier.update({
    where: { id: req.params.id as string },
    data: {
      ...(priceUsd !== undefined && { priceUsd }),
      ...(tokenAmount !== undefined && { tokenAmount }),
      ...(promoTokenAmount !== undefined && { promoTokenAmount: promoTokenAmount || null }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  res.json({ tier });
}));

adminRoutes.delete('/tiers/:id', asyncHandler(async (req, res) => {
  await prisma.tokenTier.delete({ where: { id: req.params.id as string } });
  res.json({ message: 'Deleted' });
}));

adminRoutes.put('/config', asyncHandler(async (req, res) => {
  const { rateUsdPerToken, bioText, customVideoText } = req.body;

  const siteConfig = await prisma.siteConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      ...(rateUsdPerToken !== undefined && { rateUsdPerToken }),
      ...(bioText !== undefined && { bioText }),
      ...(customVideoText !== undefined && { customVideoText }),
    },
    update: {
      ...(rateUsdPerToken !== undefined && { rateUsdPerToken }),
      ...(bioText !== undefined && { bioText }),
      ...(customVideoText !== undefined && { customVideoText }),
    },
  });

  res.json({ config: siteConfig });
}));
