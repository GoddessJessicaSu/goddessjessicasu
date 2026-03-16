import { Currency } from '@prisma/client';
import { prisma } from '../prisma';
import { config } from '../config';

export async function convertCryptoToTokens(amount: number, currency: Currency): Promise<number> {
  const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 1 } });

  if (currency === 'USDT_TRC20') {
    // USDT is 1:1 with USD
    const rateUsdPerToken = siteConfig?.rateUsdPerToken ?? (1 / config.crypto.tokenRatePerUsd);
    return amount / rateUsdPerToken;
  }

  if (currency === 'BTC') {
    if (siteConfig?.rateBtcPerToken) {
      return amount / siteConfig.rateBtcPerToken;
    }
    // Fallback: fetch live BTC price and convert via USD rate
    const btcUsd = await fetchBtcPrice();
    const usdAmount = amount * btcUsd;
    const rateUsdPerToken = siteConfig?.rateUsdPerToken ?? (1 / config.crypto.tokenRatePerUsd);
    return usdAmount / rateUsdPerToken;
  }

  if (currency === 'ETH') {
    if (siteConfig?.rateEthPerToken) {
      return amount / siteConfig.rateEthPerToken;
    }
    const ethUsd = await fetchEthPrice();
    const usdAmount = amount * ethUsd;
    const rateUsdPerToken = siteConfig?.rateUsdPerToken ?? (1 / config.crypto.tokenRatePerUsd);
    return usdAmount / rateUsdPerToken;
  }

  throw new Error(`Unsupported currency: ${currency}`);
}

const CACHE_TTL_MS = 60_000; // 1 minute
let priceCache: { btc: number; eth: number; fetchedAt: number } | null = null;
let inflightFetch: Promise<{ btc: number; eth: number }> | null = null;

async function fetchPrices(): Promise<{ btc: number; eth: number }> {
  if (priceCache && Date.now() - priceCache.fetchedAt < CACHE_TTL_MS) {
    return { btc: priceCache.btc, eth: priceCache.eth };
  }
  // Deduplicate concurrent requests
  if (inflightFetch) return inflightFetch;

  inflightFetch = (async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch crypto prices: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as any;
      if (!data?.bitcoin?.usd || !data?.ethereum?.usd) {
        throw new Error('Invalid crypto price response');
      }
      const prices = { btc: data.bitcoin.usd, eth: data.ethereum.usd };
      priceCache = { ...prices, fetchedAt: Date.now() };
      return prices;
    } finally {
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

export async function fetchBtcPrice(): Promise<number> {
  return (await fetchPrices()).btc;
}

export async function fetchEthPrice(): Promise<number> {
  return (await fetchPrices()).eth;
}
