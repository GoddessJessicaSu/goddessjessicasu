import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getPresignedUrl } from '../services/minio.service';
import { sendPurchaseReceiptEmail } from '../services/mail.service';
import { createServiceLogger } from '../logger';
import { asyncHandler } from '../middleware/async-handler';

const log = createServiceLogger('purchase');

export const purchaseRoutes = Router();

// Get user's vault (purchased media) — must be before /:mediaId
purchaseRoutes.get('/vault', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: req.user!.id },
    include: { media: { include: { assets: { orderBy: { sortOrder: 'asc' } } } } },
    orderBy: { createdAt: 'desc' },
  });

  const items = await Promise.all(
    purchases.map(async (p) => ({
      id: p.media.id,
      title: p.media.title,
      description: p.media.description,
      mimeType: p.media.mimeType,
      durationSecs: p.media.durationSecs,
      tokensSpent: p.tokensSpent,
      purchasedAt: p.createdAt,
      streamUrl: await getPresignedUrl('products', p.media.minioKey),
      thumbnailUrls: await Promise.all(
        p.media.assets.map((a) => getPresignedUrl('previewImages', a.objectKey))
      ),
    }))
  );

  res.json({ items });
}));

// Purchase media
purchaseRoutes.post('/:mediaId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const mediaId = req.params.mediaId as string;

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || !media.isPublished) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Check if already purchased
  const existing = await prisma.purchase.findUnique({
    where: { userId_mediaId: { userId: user.id, mediaId } },
  });
  if (existing) {
    const url = await getPresignedUrl('products', media.minioKey);
    res.json({ message: 'Already purchased', streamUrl: url });
    return;
  }

  if (user.tokenBalance < media.priceTokens) {
    res.status(400).json({ error: 'Insufficient balance', required: media.priceTokens, current: user.tokenBalance });
    return;
  }

  // Atomic: deduct tokens + create purchase
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { tokenBalance: { decrement: media.priceTokens } },
    }),
    prisma.purchase.create({
      data: {
        userId: user.id,
        mediaId,
        tokensSpent: media.priceTokens,
      },
    }),
  ]);

  const streamUrl = await getPresignedUrl('products', media.minioKey);

  // Send receipt email (non-blocking)
  sendPurchaseReceiptEmail(user.email, media.title, media.priceTokens).catch((err) =>
    log.error({ err, userId: user.id, mediaId }, 'Failed to send receipt email')
  );

  res.json({ streamUrl, tokensSpent: media.priceTokens });
}));
