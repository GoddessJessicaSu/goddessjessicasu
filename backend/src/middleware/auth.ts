import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; isAdmin: boolean };
}

/** Like authMiddleware but never rejects — just sets req.user if a valid token is present */
export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (user) {
      req.user = { id: user.id, email: user.email, isAdmin: user.isAdmin };
    }
  } catch {
    // Invalid/expired token — just continue as unauthenticated
  }
  next();
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    // Enforce email whitelist (admins are always allowed)
    if (!user.isAdmin) {
      const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
      if (siteConfig?.whitelistEnabled) {
        const isWhitelisted = await prisma.whitelistedEmail.findUnique({ where: { email: user.email } });
        if (!isWhitelisted) {
          res.status(403).json({ error: 'Your access has been revoked' });
          return;
        }
      }
    }

    req.user = { id: user.id, email: user.email, isAdmin: user.isAdmin };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      req.log?.error({ err }, 'Auth middleware error');
      res.status(500).json({ error: 'Authentication error' });
    }
  }
}
