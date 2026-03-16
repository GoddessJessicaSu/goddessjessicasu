import { JsonRpcProvider } from 'ethers';
import { prisma } from '../prisma';
import { config } from '../config';
import { convertCryptoToTokens } from '../utils/conversion';
import { createServiceLogger } from '../logger';

const log = createServiceLogger('crypto-listener');

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, label: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        log.warn({ url, attempt, label }, 'Retrying fetch');
      }
      return await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    } catch (err) {
      lastErr = err;
      log.warn({ err, url, attempt, label }, 'Fetch failed');
    }
  }
  throw lastErr;
}

let intervalId: ReturnType<typeof setInterval> | null = null;


export function startCryptoListener() {
  log.info({
    network: config.crypto.network,
    btcApi: config.blockchain.btcApiUrl,
    ethRpc: config.blockchain.ethRpcUrl,
    tronApi: config.blockchain.tronApiUrl,
    usdtContract: config.crypto.usdtTrc20Contract,
    pollIntervalMs: config.crypto.pollIntervalMs,
  }, 'Crypto listener started');
  intervalId = setInterval(pollPendingTransactions, config.crypto.pollIntervalMs);
}

export function stopCryptoListener() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    log.info('Crypto listener stopped');
  }
}

async function pollPendingTransactions() {
  try {
    // Expire old pending transactions
    const expired = await prisma.transaction.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    if (expired.count > 0) {
      log.info({ count: expired.count }, 'Expired pending transactions');
    }

    const pending = await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
    });

    if (pending.length === 0) {
      log.debug('No pending transactions to check');
      return;
    }

    log.info({ count: pending.length }, 'Polling pending transactions');

    for (const tx of pending) {
      try {
        log.debug({ txId: tx.id, currency: tx.currency, address: tx.depositAddress, userId: tx.userId }, 'Checking transaction');
        switch (tx.currency) {
          case 'BTC':
            await checkBtc(tx);
            break;
          case 'ETH':
            await checkEth(tx);
            break;
          case 'USDT_TRC20':
            await checkUsdtTrc20(tx);
            break;
        }
      } catch (err) {
        log.error({ err, txId: tx.id, currency: tx.currency, address: tx.depositAddress }, 'Failed to check transaction');
      }
    }
  } catch (err) {
    log.error({ err }, 'Crypto listener poll error');
  }
}

async function getUsedTxHashes(depositAddress: string): Promise<Set<string>> {
  const confirmed = await prisma.transaction.findMany({
    where: { depositAddress, status: 'CONFIRMED', txHash: { not: null } },
    select: { txHash: true },
  });
  return new Set(confirmed.map((t) => t.txHash!));
}

async function checkBtc(tx: any) {
  const url = `${config.blockchain.btcApiUrl}/address/${tx.depositAddress}/utxo`;
  log.debug({ txId: tx.id, url }, 'Fetching BTC UTXOs');
  const res = await fetchWithRetry(url, 'BTC UTXO');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BTC API error: ${res.status} ${res.statusText} (url=${url}${body ? `, body=${body}` : ''})`);
  }
  const utxos = await res.json();

  if (!Array.isArray(utxos) || utxos.length === 0) {
    log.debug({ txId: tx.id, address: tx.depositAddress }, 'No UTXOs found');
    return;
  }

  // Filter out UTXOs already claimed by previous confirmed transactions
  const usedHashes = await getUsedTxHashes(tx.depositAddress);
  const confirmedUtxos = utxos.filter((u: any) => u.status?.confirmed && !usedHashes.has(u.txid));
  const unconfirmedCount = utxos.filter((u: any) => !u.status?.confirmed).length;

  if (unconfirmedCount > 0) {
    log.info({ txId: tx.id, address: tx.depositAddress, unconfirmedCount }, 'Found unconfirmed UTXOs, waiting for confirmation');
  }

  if (confirmedUtxos.length === 0) {
    log.debug({ txId: tx.id, address: tx.depositAddress, skippedUsed: usedHashes.size }, 'No new confirmed UTXOs');
    return;
  }

  const totalSats = confirmedUtxos.reduce((sum: number, u: any) => sum + u.value, 0);
  const amountBtc = totalSats / 1e8;
  const txHash = confirmedUtxos[0].txid;

  log.info({ txId: tx.id, address: tx.depositAddress, utxoCount: confirmedUtxos.length, totalSats, amountBtc, txHash }, 'Confirmed BTC UTXOs found');
  await confirmTransaction(tx, amountBtc, txHash);
}

async function checkEth(tx: any) {
  log.debug({ txId: tx.id, address: tx.depositAddress, rpc: config.blockchain.ethRpcUrl }, 'Checking ETH balance');

  // Look up incoming transactions via Blockscout API and filter out already-claimed ones
  const usedHashes = await getUsedTxHashes(tx.depositAddress);

  try {
    const explorerUrl = `${config.blockchain.ethExplorerApiUrl}?module=account&action=txlist&address=${tx.depositAddress}&sort=desc&page=1&offset=20`;
    const res = await fetchWithRetry(explorerUrl, 'Blockscout txlist');
    if (!res.ok) {
      log.warn({ txId: tx.id, status: res.status }, 'Blockscout API error');
      return;
    }

    const data = (await res.json()) as any;
    if (!Array.isArray(data.result)) {
      log.warn({ txId: tx.id }, 'Blockscout returned non-array result');
      return;
    }

    // Find incoming transfers not yet claimed by a confirmed transaction
    const newIncoming = data.result.filter(
      (t: any) =>
        t.to?.toLowerCase() === tx.depositAddress.toLowerCase() &&
        Number(t.value) > 0 &&
        t.txreceipt_status === '1' &&
        !usedHashes.has(t.hash)
    );

    if (newIncoming.length === 0) {
      log.debug({ txId: tx.id, address: tx.depositAddress, skippedUsed: usedHashes.size }, 'No new incoming ETH transactions');
      return;
    }

    const totalWei = newIncoming.reduce((sum: bigint, t: any) => sum + BigInt(t.value), 0n);
    const amountEth = Number(totalWei) / 1e18;
    const txHash = newIncoming[0].hash;

    log.info({ txId: tx.id, address: tx.depositAddress, amountEth, txHash, newTxCount: newIncoming.length }, 'New ETH deposit found');
    await confirmTransaction(tx, amountEth, txHash);
  } catch (err) {
    log.error({ err, txId: tx.id }, 'Failed to check ETH transactions');
  }
}


async function checkUsdtTrc20(tx: any) {
  const url = `${config.blockchain.tronApiUrl}/v1/accounts/${tx.depositAddress}/transactions/trc20?limit=10&contract_address=${config.crypto.usdtTrc20Contract}`;
  log.debug({ txId: tx.id, url }, 'Fetching USDT TRC20 transactions');
  const res = await fetchWithRetry(url, 'TRON TRC20');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TRON API error: ${res.status} ${res.statusText} (url=${url}${body ? `, body=${body}` : ''})`);
  }
  const data = (await res.json()) as any;

  if (!data.data?.length) {
    log.debug({ txId: tx.id, address: tx.depositAddress }, 'No TRC20 transactions found');
    return;
  }

  log.debug({ txId: tx.id, address: tx.depositAddress, txCount: data.data.length }, 'TRC20 transactions fetched');

  const usedHashes = await getUsedTxHashes(tx.depositAddress);
  const incoming = data.data.filter(
    (t: any) => t.to?.toLowerCase() === tx.depositAddress.toLowerCase() && t.type === 'Transfer' && !usedHashes.has(t.transaction_id)
  );
  if (incoming.length === 0) {
    log.debug({ txId: tx.id, address: tx.depositAddress }, 'No incoming TRC20 transfers');
    return;
  }

  const totalAmount = incoming.reduce((sum: number, t: any) => sum + Number(t.value) / 1e6, 0);
  const txHash = incoming[0].transaction_id;

  log.info({ txId: tx.id, address: tx.depositAddress, incomingCount: incoming.length, totalAmount, txHash }, 'Incoming USDT TRC20 transfers found');
  await confirmTransaction(tx, totalAmount, txHash);
}

async function confirmTransaction(tx: any, amountCrypto: number, txHash?: string) {
  // If tier-based, credit the fixed tier token amount; otherwise calculate from crypto
  const amountTokens = tx.expectedTokens ?? await convertCryptoToTokens(amountCrypto, tx.currency);

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'CONFIRMED',
        amountCrypto,
        amountTokens,
        txHash: txHash || null,
        confirmedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: tx.userId },
      data: { tokenBalance: { increment: amountTokens } },
    }),
  ]);

  log.info({ txId: tx.id, amountCrypto, currency: tx.currency, amountTokens, userId: tx.userId }, 'Transaction confirmed');
}
