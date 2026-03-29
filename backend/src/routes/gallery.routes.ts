import { Router } from 'express';
import { prisma } from '../prisma';
import { getPresignedUrl } from '../services/storage.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

export const galleryRoutes = Router();

const GALLERY_PAGE_SIZE = 12;

// Get all categories and tags for filter UI
galleryRoutes.get('/filters', authMiddleware, asyncHandler(async (_req, res) => {
  const categories = await prisma.attributeCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { tags: { orderBy: { sortOrder: 'asc' } } },
  });
  res.json({ categories });
}));

galleryRoutes.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const cursor = req.query.cursor as string | undefined;
  const take = GALLERY_PAGE_SIZE;

  // Filter params
  const tagIds = req.query.tags ? (req.query.tags as string).split(',').filter(Boolean) : [];
  const minLength = req.query.minLength ? parseFloat(req.query.minLength as string) : null;
  const maxLength = req.query.maxLength ? parseFloat(req.query.maxLength as string) : null;

  const where: any = { isPublished: true };

  if (tagIds.length > 0) {
    where.tags = { some: { tagId: { in: tagIds } } };
  }

  if (minLength !== null || maxLength !== null) {
    where.lengthMinutes = {};
    if (minLength !== null) where.lengthMinutes.gte = minLength;
    if (maxLength !== null) where.lengthMinutes.lte = maxLength;
  }

  const media = await prisma.media.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      assets: { orderBy: { sortOrder: 'asc' } },
      tags: { include: { tag: { include: { category: true } } } },
    },
    take: take + 1,
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
      lengthMinutes: m.lengthMinutes,
      thumbnailUrls: await Promise.all(
        m.assets.map((a) => getPresignedUrl('previewImages', a.objectKey))
      ),
      previewUrl: m.previewKey ? await getPresignedUrl('previewVideos', m.previewKey) : null,
      purchased: purchasedIds.has(m.id),
      tags: m.tags.map((mt) => ({
        id: mt.tag.id,
        name: mt.tag.name,
        categoryId: mt.tag.categoryId,
        categoryName: mt.tag.category.name,
      })),
    }))
  );

  res.json({ media: items, nextCursor });
}));
