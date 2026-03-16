import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config';
import logger from '../logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const log = req.log || logger;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      log.warn({ err }, 'Record not found');
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    if (err.code === 'P2002') {
      log.warn({ err }, 'Unique constraint violation');
      res.status(409).json({ error: 'Resource already exists' });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    log.warn({ err }, 'Validation error');
    res.status(400).json({ error: 'Invalid request data' });
    return;
  }

  log.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: config.isDev ? err.message : 'Internal server error',
  });
}
