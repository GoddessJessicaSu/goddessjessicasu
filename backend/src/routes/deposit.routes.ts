import { Router } from 'express';
import { prisma } from '../prisma';
import { config } from '../config';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { createPayment } from '../services/nowpayments.service';

export const depositRoutes = Router();

// Get active tiers
depositRoutes.get('/tiers', authMiddleware, asyncHandler(async (_req: AuthRequest, res) => {
  const tiers = await prisma.tokenTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({
    tiers: tiers.map((tier) => ({
      id: tier.id,
      priceUsd: tier.priceUsd,
      tokenAmount: tier.tokenAmount,
      promoTokenAmount: tier.promoTokenAmount,
    })),
  });
}));

// Initiate a deposit via NOWPayments
depositRoutes.post('/initiate', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { tierId } = req.body;
  if (!tierId) {
    res.status(400).json({ error: 'tierId is required' });
    return;
  }

  const tier = await prisma.tokenTier.findUnique({ where: { id: tierId } });
  if (!tier || !tier.isActive) {
    res.status(400).json({ error: 'Invalid or inactive tier' });
    return;
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user!.id,
      currency: 'pending',
      depositAddress: 'pending',
      tierId: tier.id,
      expectedTokens: tier.promoTokenAmount ?? tier.tokenAmount,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const callbackUrl = config.nowpayments.callbackUrl || `${config.frontendUrl.replace(/\/$/, '')}/api/webhooks/nowpayments`;

  const invoice = await createPayment({
    priceAmount: tier.priceUsd,
    orderId: transaction.id,
    ipnCallbackUrl: callbackUrl,
  });

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { nowpaymentsId: String(invoice.id) },
  });

  res.json({
    transactionId: transaction.id,
    invoiceUrl: invoice.invoice_url,
  });
}));

// Check deposit status
depositRoutes.get('/status/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const tx = await prisma.transaction.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });

  if (!tx) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  res.json({
    id: tx.id,
    currency: tx.currency,
    status: tx.status,
    amountCrypto: tx.amountCrypto,
    amountTokens: tx.amountTokens,
    txHash: tx.txHash,
    createdAt: tx.createdAt,
    confirmedAt: tx.confirmedAt,
  });
}));

// Mock deposit (dev only)
if (config.isDev) {
  depositRoutes.post('/mock', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'positive amount required' });
      return;
    }

    const tokensToCredit = amount;
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { tokenBalance: { increment: tokensToCredit } },
    });

    res.json({ credited: tokensToCredit, newBalance: (await prisma.user.findUnique({ where: { id: req.user!.id } }))!.tokenBalance });
  }));
}
