import { Router } from 'express';
import { prisma } from '../prisma';
import { getPresignedUrl } from '../services/storage.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

export const galleryRoutes = Router();

const GALLERY_PAGE_SIZE = 12;

galleryRoutes.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const cursor = req.query.cursor as string | undefined;
  const take = GALLERY_PAGE_SIZE;

  const media = await prisma.media.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { assets: { orderBy: { sortOrder: 'asc' } } },
    take: take + 1, // fetch one extra to detect if there's a next page
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = media.length > take;
  const page = hasMore ? media.slice(0, take) : media;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

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
    page.map(async (m) => ({
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

  res.json({ media: items, nextCursor });
}));
