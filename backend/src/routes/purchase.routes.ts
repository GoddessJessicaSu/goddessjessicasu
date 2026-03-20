import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getPresignedUrl } from '../services/storage.service';
import { sendPurchaseDownloadEmail } from '../services/mail.service';
import { createServiceLogger } from '../logger';
import { asyncHandler } from '../middleware/async-handler';

const log = createServiceLogger('purchase');

const purchaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export const purchaseRoutes = Router();

// Get user's vault (purchased media) — must be before /:mediaId
purchaseRoutes.get('/vault', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: req.user!.id },
    include: { media: { include: { assets: { orderBy: { sortOrder: 'asc' } } } } },
    orderBy: { createdAt: 'desc' },
  });

  const items = purchases.map((p) => ({
    id: p.media.id,
    title: p.media.title,
    tokensSpent: p.tokensSpent,
    purchasedAt: p.createdAt,
  }));

  res.json({ items });
}));

// Purchase media
purchaseRoutes.post('/:mediaId', purchaseLimiter, authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
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

  // Check if already purchased — no resend
  const existing = await prisma.purchase.findUnique({
    where: { userId_mediaId: { userId: user.id, mediaId } },
  });
  if (existing) {
    res.status(400).json({ error: 'Already purchased. Download link was sent to your email.' });
    return;
  }

  // Atomic conditional update to prevent race condition (double-spend)
  const result = await prisma.user.updateMany({
    where: { id: user.id, tokenBalance: { gte: media.priceTokens } },
    data: { tokenBalance: { decrement: media.priceTokens } },
  });
  if (result.count === 0) {
    res.status(400).json({ error: 'Insufficient balance', required: media.priceTokens, current: user.tokenBalance });
    return;
  }

  await prisma.purchase.create({
    data: {
      userId: user.id,
      mediaId,
      tokensSpent: media.priceTokens,
    },
  });

  const downloadUrl = await getPresignedUrl('products', media.minioKey, media.originalFilename ?? undefined);

  // Send download email (non-blocking)
  sendPurchaseDownloadEmail(user.email, media.title, downloadUrl).catch((err) =>
    log.error({ err, userId: user.id, mediaId }, 'Failed to send download email')
  );

  res.json({ message: 'Download link sent to your email', tokensSpent: media.priceTokens });
}));
