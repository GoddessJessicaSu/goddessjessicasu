import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma';
import { config } from '../config';
import { sendMagicLinkEmail } from '../services/mail.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

export const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Get current user
authRoutes.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance,
    },
  });
}));

// Set username
authRoutes.put('/username', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 30) {
    res.status(400).json({ error: 'Username must be 2-30 characters' });
    return;
  }

  // Check uniqueness
  const existing = await prisma.user.findUnique({ where: { username: trimmed } });
  if (existing && existing.id !== req.user!.id) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { username: trimmed },
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance,
    },
  });
}));

// Request magic link
authRoutes.post('/request', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check email whitelist if enabled
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (siteConfig?.whitelistEnabled) {
    const isWhitelisted = await prisma.whitelistedEmail.findUnique({ where: { email: normalizedEmail } });
    // Always allow admin email through
    if (!isWhitelisted && normalizedEmail !== config.adminEmail) {
      res.status(403).json({ error: 'This email is not authorized. Access is currently restricted.' });
      return;
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  // Find or create user stub — but don't create the user yet (created on verify)
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const magicLink = await prisma.magicLink.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt,
      userId: existingUser?.id,
    },
  });

  await sendMagicLinkEmail(normalizedEmail, token);
  res.json({ message: 'Magic link sent', linkId: magicLink.id });
}));

// Verify magic link
authRoutes.get('/verify', authLimiter, asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const magicLink = await prisma.magicLink.findUnique({ where: { token } });
  if (!magicLink) {
    res.status(400).json({ error: 'Invalid token' });
    return;
  }
  if (magicLink.usedAt) {
    res.status(400).json({ error: 'Token already used' });
    return;
  }
  if (magicLink.expiresAt < new Date()) {
    res.status(400).json({ error: 'Token expired' });
    return;
  }

  // Mark token as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email: magicLink.email } });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email: magicLink.email,
        isAdmin: magicLink.email === config.adminEmail,
      },
    });
  }

  const jwtToken = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

  // If user has no username, treat as needing setup
  const needsUsername = !user.username;

  res.json({
    token: jwtToken,
    needsUsername,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance,
    },
  });
}));

// Poll magic link status (for the original sign-in page)
authRoutes.get('/poll', asyncHandler(async (req, res) => {
  const { linkId } = req.query;
  if (!linkId || typeof linkId !== 'string') {
    res.status(400).json({ error: 'linkId is required' });
    return;
  }

  const magicLink = await prisma.magicLink.findUnique({ where: { id: linkId } });
  if (!magicLink) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  if (!magicLink.usedAt) {
    // Not yet verified
    res.json({ status: 'pending' });
    return;
  }

  // One-time-use: JWT already issued via poll
  if (magicLink.polledAt) {
    res.status(400).json({ error: 'Token already consumed' });
    return;
  }

  // Mark as polled so JWT can only be issued once via this endpoint
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { polledAt: new Date() },
  });

  // Link was used — find the user and issue a JWT
  const user = await prisma.user.findUnique({ where: { email: magicLink.email } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const jwtToken = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
  const needsUsername = !user.username;

  res.json({
    status: 'verified',
    token: jwtToken,
    needsUsername,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance,
    },
  });
}));
