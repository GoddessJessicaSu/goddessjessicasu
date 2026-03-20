import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import {
  getUploadUrl,
  getPresignedUrl,
  initiateMultipartUpload,
  getMultipartPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  deleteObject,
} from '../services/storage.service';
import { asyncHandler } from '../middleware/async-handler';
import crypto from 'crypto';

function shortKey(filename: string): string {
  const id = crypto.randomBytes(4).toString('hex');
  return `${id}_${filename}`;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').toLowerCase();
}

export const adminRoutes = Router();
adminRoutes.use(authMiddleware);
adminRoutes.use(adminMiddleware);

// --- Media Management ---

const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB per part

// Create media entry + get upload URLs
adminRoutes.post('/media', asyncHandler(async (req, res) => {
  const { title, description, priceTokens, productFile, previewClip, previewImageCount = 1, storjKey } = req.body;

  if (!title || priceTokens == null || !productFile?.name || !productFile?.mimeType || (!storjKey && !productFile?.size)) {
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
      minioKey: storjKey || shortKey(productFile.name),
      originalFilename: productFile.name,
      previewKey: hasPreviewClip ? shortKey(previewClip.name) : null,
      mimeType: productFile.mimeType,
      durationSecs: null,
    },
  });

  const folder = `${media.id}_${sanitize(title)}`;

  await prisma.mediaAsset.createMany({
    data: Array.from({ length: count }, (_, i) => ({
      mediaId: media.id,
      objectKey: `${folder}/preview_${i}.webp`,
      sortOrder: i,
    })),
  });

  const mediaWithAssets = await prisma.media.findUniqueOrThrow({
    where: { id: media.id },
    include: { assets: { orderBy: { sortOrder: 'asc' } } },
  });

  Object.assign(media, mediaWithAssets);

  // Product file upload — skip if already uploaded to Storj via CLI
  let productUpload: any = null;
  if (!storjKey) {
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
  }

  // Preview clip upload (optional)
  let previewClipUpload: { url: string } | undefined;
  if (hasPreviewClip && media.previewKey) {
    const url = await getUploadUrl('previewVideos', media.previewKey);
    previewClipUpload = { url };
  }

  // Preview image asset IDs (images are uploaded via /admin/media/assets/:assetId/upload)
  const previewImageAssets = mediaWithAssets.assets.map((a: { id: string; sortOrder: number }) => ({
    assetId: a.id,
    sortOrder: a.sortOrder,
  }));

  res.json({ media, productUpload, previewClipUpload, previewImageAssets });
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
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { assets: true } },
      assets: { orderBy: { sortOrder: 'asc' } },
    },
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

// Reorder media (gallery order)
adminRoutes.put('/media-order', asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'order[] (array of media IDs) required' });
    return;
  }

  await prisma.$transaction(
    order.map((id: string, i: number) =>
      prisma.media.update({
        where: { id },
        data: { sortOrder: i },
      })
    )
  );

  res.json({ message: 'Reordered' });
}));

// Get single media with asset preview URLs
adminRoutes.get('/media/:id', asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id as string },
    include: { assets: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const assets = await Promise.all(
    media.assets.map(async (a) => ({
      id: a.id,
      objectKey: a.objectKey,
      sortOrder: a.sortOrder,
      url: await getPresignedUrl('previewImages', a.objectKey),
    }))
  );

  res.json({ media: { ...media, assets } });
}));

// Delete a single preview image asset
adminRoutes.delete('/media/:id/assets/:assetId', asyncHandler(async (req, res) => {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: req.params.assetId as string, mediaId: req.params.id as string },
  });
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }

  await deleteObject('previewImages', asset.objectKey).catch(() => {});
  await prisma.mediaAsset.delete({ where: { id: asset.id } });

  res.json({ message: 'Asset deleted' });
}));

// Add new preview image assets to existing media
adminRoutes.post('/media/:id/assets', asyncHandler(async (req, res) => {
  const { count } = req.body;
  if (!count || count < 1 || count > 10) {
    res.status(400).json({ error: 'count (1-10) required' });
    return;
  }

  const media = await prisma.media.findUnique({
    where: { id: req.params.id as string },
    include: { assets: true },
  });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const existingCount = media.assets.length;
  if (existingCount + count > 10) {
    res.status(400).json({ error: `Can only have 10 preview images. Currently ${existingCount}, requested ${count}` });
    return;
  }

  const maxSort = media.assets.reduce((max, a) => Math.max(max, a.sortOrder), -1);

  const newAssets = await prisma.$transaction(
    Array.from({ length: count }, (_, i) =>
      prisma.mediaAsset.create({
        data: {
          mediaId: media.id,
          objectKey: `${media.id}_${sanitize(media.title)}/preview_${maxSort + 1 + i}.webp`,
          sortOrder: maxSort + 1 + i,
        },
      })
    )
  );

  const assets = newAssets.map((a) => ({
    assetId: a.id,
    sortOrder: a.sortOrder,
  }));

  res.json({ assets });
}));

// Reorder preview image assets
adminRoutes.put('/media/:id/assets/reorder', asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'order[] (array of asset IDs) required' });
    return;
  }

  const media = await prisma.media.findUnique({
    where: { id: req.params.id as string },
    include: { assets: true },
  });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const assetIds = new Set(media.assets.map((a) => a.id));
  for (const id of order) {
    if (!assetIds.has(id)) {
      res.status(400).json({ error: `Asset ${id} does not belong to this media` });
      return;
    }
  }

  await prisma.$transaction(
    order.map((assetId: string, i: number) =>
      prisma.mediaAsset.update({
        where: { id: assetId },
        data: { sortOrder: i },
      })
    )
  );

  res.json({ message: 'Reordered' });
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
  const { rateUsdPerToken, bioText, customVideoText, whitelistEnabled } = req.body;

  const siteConfig = await prisma.siteConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      ...(rateUsdPerToken !== undefined && { rateUsdPerToken }),
      ...(bioText !== undefined && { bioText }),
      ...(customVideoText !== undefined && { customVideoText }),
      ...(whitelistEnabled !== undefined && { whitelistEnabled }),
    },
    update: {
      ...(rateUsdPerToken !== undefined && { rateUsdPerToken }),
      ...(bioText !== undefined && { bioText }),
      ...(customVideoText !== undefined && { customVideoText }),
      ...(whitelistEnabled !== undefined && { whitelistEnabled }),
    },
  });

  res.json({ config: siteConfig });
}));

// --- Email Whitelist ---

adminRoutes.get('/whitelist', asyncHandler(async (_req, res) => {
  const emails = await prisma.whitelistedEmail.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ emails });
}));

adminRoutes.post('/whitelist', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.whitelistedEmail.findUnique({ where: { email: normalized } });
  if (existing) {
    res.status(409).json({ error: 'Email already whitelisted' });
    return;
  }
  const entry = await prisma.whitelistedEmail.create({ data: { email: normalized } });
  res.json({ entry });
}));

adminRoutes.delete('/whitelist/:id', asyncHandler(async (req, res) => {
  await prisma.whitelistedEmail.delete({ where: { id: req.params.id as string } });
  res.json({ message: 'Removed' });
}));

