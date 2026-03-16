import { Router } from 'express';
import { prisma } from '../prisma';
import { getPresignedUrl } from '../services/minio.service';
import { asyncHandler } from '../middleware/async-handler';

export const galleryRoutes = Router();

galleryRoutes.get('/', asyncHandler(async (_req, res) => {
  const media = await prisma.media.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: { assets: { orderBy: { sortOrder: 'asc' } } },
  });

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
      purchased: false,
    }))
  );

  res.json({ media: items });
}));
