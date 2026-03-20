import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../middleware/async-handler';

export const statsRoutes = Router();

statsRoutes.get('/', asyncHandler(async (_req, res) => {
  let config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.siteConfig.create({ data: { id: 1 } });
  }

  res.json({ bodyCount: config.bodyCount, year: new Date().getFullYear() });
}));
