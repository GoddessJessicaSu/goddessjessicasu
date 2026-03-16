import crypto from 'crypto';
import { config } from '../config';
import logger from '../logger';

interface CreatePaymentParams {
  priceAmount: number;
  orderId: string;
  ipnCallbackUrl: string;
}

interface InvoiceResponse {
  id: string;
  invoice_url: string;
  [key: string]: unknown;
}

export async function createPayment({ priceAmount, orderId, ipnCallbackUrl }: CreatePaymentParams): Promise<InvoiceResponse> {
  const res = await fetch(`${config.nowpayments.apiBaseUrl}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': config.nowpayments.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: priceAmount,
      price_currency: 'usd',
      order_id: orderId,
      ipn_callback_url: ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'NOWPayments API error');
    throw new Error(`NOWPayments API error: ${res.status}`);
  }

  return res.json() as Promise<InvoiceResponse>;
}

export function verifyIpnSignature(body: Record<string, unknown>, signature: string): boolean {
  const sorted = Object.keys(body)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = body[key];
      return acc;
    }, {});

  const hmac = crypto
    .createHmac('sha512', config.nowpayments.ipnSecret)
    .update(JSON.stringify(sorted))
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}
