import { Router } from 'express';
import { prisma } from '../prisma';
import { getPresignedUrl } from '../services/minio.service';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

export const galleryRoutes = Router();

galleryRoutes.get('/', optionalAuthMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const media = await prisma.media.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: { assets: { orderBy: { sortOrder: 'asc' } } },
  });

  // If user is logged in, fetch their purchased media IDs
  let purchasedIds = new Set<string>();
  if (req.user) {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      select: { mediaId: true },
    });
    purchasedIds = new Set(purchases.map((p) => p.mediaId));
  }

  const items = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      priceTokens: m.priceTokens,
      mimeType: m.mimeType,
      durationSecs: m.durationSecs,
      thumbnailUrls: await Promise.all(
        m.assets.map((a) => getPresignedUrl('previewImages', a.objectKey))
      ),
      previewUrl: m.previewKey ? await getPresignedUrl('previewVideos', m.previewKey) : null,
      purchased: purchasedIds.has(m.id),
    }))
  );

  res.json({ media: items });
}));
