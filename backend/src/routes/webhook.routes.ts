import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { verifyIpnSignature } from '../services/nowpayments.service';
import logger from '../logger';

export const webhookRoutes = Router();

webhookRoutes.post('/nowpayments', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-nowpayments-sig'] as string | undefined;
    if (!signature) {
      res.status(403).json({ error: 'Missing signature' });
      return;
    }

    const body = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    if (!verifyIpnSignature(body, signature)) {
      logger.warn('Invalid NOWPayments IPN signature');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    const {
      payment_id,
      payment_status,
      order_id,
      actually_paid,
      pay_currency,
      price_amount,
    } = body;

    logger.info({ payment_id, payment_status, order_id }, 'NOWPayments IPN received');

    if (payment_status !== 'finished') {
      res.json({ status: 'ok' });
      return;
    }

    const transaction = await prisma.transaction.findUnique({
      where: { nowpaymentsId: String(payment_id) },
      include: { tier: true },
    });

    if (!transaction) {
      logger.warn({ payment_id, order_id }, 'Transaction not found for IPN');
      res.status(200).json({ status: 'ok' });
      return;
    }

    if (transaction.status === 'CONFIRMED') {
      res.json({ status: 'already_confirmed' });
      return;
    }

    // Verify price matches tier
    if (transaction.tier && Math.abs(transaction.tier.priceUsd - Number(price_amount)) > 0.01) {
      logger.error({ expected: transaction.tier.priceUsd, received: price_amount }, 'Price mismatch');
      res.status(400).json({ error: 'Price mismatch' });
      return;
    }

    const tokensToCredit = transaction.expectedTokens ?? 0;

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CONFIRMED',
          currency: String(pay_currency),
          amountCrypto: Number(actually_paid) || null,
          amountTokens: tokensToCredit,
          confirmedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: { tokenBalance: { increment: tokensToCredit } },
      }),
    ]);

    logger.info({ transactionId: transaction.id, tokensToCredit }, 'Payment confirmed via IPN');
    res.json({ status: 'confirmed' });
  } catch (err) {
    logger.error({ err }, 'Webhook processing error');
    res.status(500).json({ error: 'Internal error' });
  }
});
