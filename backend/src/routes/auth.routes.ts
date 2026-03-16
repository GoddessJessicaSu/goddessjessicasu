import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { sendMagicLinkEmail } from '../services/mail.service';
import { deriveAllAddresses } from '../services/crypto.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

export const authRoutes = Router();

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
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance,
    },
  });
}));

// Request magic link
authRoutes.post('/request', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  // Find or create user stub — but don't create the user yet (created on verify)
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  await prisma.magicLink.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt,
      userId: existingUser?.id,
    },
  });

  await sendMagicLinkEmail(normalizedEmail, token);
  res.json({ message: 'Magic link sent' });
}));

// Verify magic link
authRoutes.get('/verify', asyncHandler(async (req, res) => {
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

  if (!user) {
    // New user — derive crypto addresses at registration time
    // We need a temporary ID for derivation. Use a transaction to get the autoincrement ID.
    user = await prisma.$transaction(async (tx) => {
      // Create with placeholder addresses first to get the ID
      const created = await tx.user.create({
        data: {
          email: magicLink.email,
          isAdmin: magicLink.email === config.adminEmail,
          btcAddress: 'pending',
          ethAddress: 'pending',
          tronAddress: 'pending',
        },
      });

      // Derive real addresses using the user ID
      const addresses = deriveAllAddresses(created.id);

      // Update with real addresses
      return tx.user.update({
        where: { id: created.id },
        data: addresses,
      });
    });
  }

  const jwtToken = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

  res.json({
    token: jwtToken,
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance,
    },
  });
}));
