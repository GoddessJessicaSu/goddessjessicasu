import { Router } from 'express';
import { Currency } from '@prisma/client';
import { prisma } from '../prisma';
import { config } from '../config';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { fetchBtcPrice, fetchEthPrice } from '../utils/conversion';

export const depositRoutes = Router();

const VALID_CURRENCIES: Currency[] = ['BTC', 'ETH'];

// Get active tiers with crypto price equivalents
depositRoutes.get('/tiers', authMiddleware, asyncHandler(async (_req: AuthRequest, res) => {
  const tiers = await prisma.tokenTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  let btcPrice: number | null = null;
  let ethPrice: number | null = null;
  try { btcPrice = await fetchBtcPrice(); } catch (err) { console.error('Failed to fetch BTC price:', err); }
  try { ethPrice = await fetchEthPrice(); } catch (err) { console.error('Failed to fetch ETH price:', err); }

  const tiersWithCrypto = tiers.map((tier) => ({
    id: tier.id,
    priceUsd: tier.priceUsd,
    tokenAmount: tier.tokenAmount,
    cryptoAmounts: {
      BTC: btcPrice ? parseFloat((tier.priceUsd / btcPrice).toFixed(8)) : null,
      ETH: ethPrice ? parseFloat((tier.priceUsd / ethPrice).toFixed(8)) : null,
      // USDT_TRC20: tier.priceUsd, // TODO: re-enable when TRON is ready
    },
  }));

  res.json({ tiers: tiersWithCrypto });
}));

// Initiate a deposit — returns the user's address for the chosen currency
depositRoutes.post('/initiate', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { currency, tierId } = req.body;
  if (!currency || !VALID_CURRENCIES.includes(currency)) {
    res.status(400).json({ error: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Prevent duplicate pending deposits for the same currency
  const existing = await prisma.transaction.findFirst({
    where: { userId: user.id, currency: currency as Currency, status: 'PENDING' },
  });
  if (existing) {
    res.status(409).json({
      error: 'You already have a pending deposit for this currency',
      transactionId: existing.id,
    });
    return;
  }

  // Look up tier if provided
  let expectedTokens: number | undefined;
  if (tierId) {
    const tier = await prisma.tokenTier.findUnique({ where: { id: tierId } });
    if (!tier || !tier.isActive) {
      res.status(400).json({ error: 'Invalid or inactive tier' });
      return;
    }
    expectedTokens = tier.tokenAmount;
  }

  // Determine deposit address based on currency
  let depositAddress: string;
  switch (currency as Currency) {
    case 'BTC':
      depositAddress = user.btcAddress;
      break;
    case 'ETH':
      depositAddress = user.ethAddress;
      break;
    case 'USDT_TRC20':
      depositAddress = user.tronAddress;
      break;
    default:
      res.status(400).json({ error: 'Unsupported currency' });
      return;
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      currency: currency as Currency,
      depositAddress,
      tierId: tierId || null,
      expectedTokens: expectedTokens ?? null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
    },
  });

  res.json({
    transactionId: transaction.id,
    currency,
    depositAddress,
    expectedTokens: expectedTokens ?? null,
    expiresAt: transaction.expiresAt,
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

// Get user's deposit addresses
depositRoutes.get('/addresses', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    BTC: user.btcAddress,
    ETH: user.ethAddress,
    // USDT_TRC20: user.tronAddress, // TODO: re-enable when TRON is ready
  });
}));

// Mock deposit (dev only)
if (config.isDev) {
  depositRoutes.post('/mock', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
    const { currency, amount } = req.body;
    if (!currency || !amount || amount <= 0) {
      res.status(400).json({ error: 'currency and positive amount required' });
      return;
    }

    const tokensToCredit = amount; // In mock mode, 1:1 for simplicity
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { tokenBalance: { increment: tokensToCredit } },
    });

    res.json({ credited: tokensToCredit, newBalance: (await prisma.user.findUnique({ where: { id: req.user!.id } }))!.tokenBalance });
  }));
}
