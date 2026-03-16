/**
 * Sweep BTC and ETH from user deposit addresses to your own wallet.
 *
 * Usage:
 *   npx tsx scripts/sweep.ts --mnemonic "your twelve word mnemonic" --btc-to <your-btc-address> --eth-to <your-eth-address>
 *   npx tsx scripts/sweep.ts --mnemonic "your twelve word mnemonic" --eth-to <your-eth-address>   # ETH only
 *   npx tsx scripts/sweep.ts --mnemonic "your twelve word mnemonic" --btc-to <your-btc-address>   # BTC only
 *   npx tsx scripts/sweep.ts --dry-run --mnemonic "..." --btc-to ... --eth-to ...                 # preview only
 *
 * Reads confirmed deposit addresses from the database and sweeps any remaining balance.
 */

import * as bip39 from "bip39";
import BIP32Factory, { BIP32Interface } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { HDNodeWallet, JsonRpcProvider, Wallet, parseEther, formatEther } from "ethers";
import { PrismaClient } from "@prisma/client";

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const prisma = new PrismaClient();

// --------------- CLI args ---------------

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : undefined;
}

const mnemonic = getArg("--mnemonic");
const btcDest = getArg("--btc-to");
const ethDest = getArg("--eth-to");
const dryRun = process.argv.includes("--dry-run");

if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
  console.error("Error: valid --mnemonic required");
  console.error('Usage: npx tsx scripts/sweep.ts --mnemonic "words ..." --btc-to <addr> --eth-to <addr>');
  process.exit(1);
}
if (!btcDest && !ethDest) {
  console.error("Error: at least one of --btc-to or --eth-to required");
  process.exit(1);
}

// --------------- Derive keys from mnemonic ---------------

const seed = bip39.mnemonicToSeedSync(mnemonic);

// Detect testnet from the BTC_XPUB in .env (loaded via prisma env) or default
const BTC_TESTNET = process.env.BTC_XPUB?.startsWith("tpub") ?? false;
const btcNetwork = BTC_TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
const btcCoinType = BTC_TESTNET ? 1 : 0;
const btcRoot = bip32.fromSeed(seed, btcNetwork);
const btcAccount = btcRoot.derivePath(`m/84'/${btcCoinType}'/0'`);

const ethRoot = HDNodeWallet.fromSeed(seed);
const ethAccount = ethRoot.derivePath("m/44'/60'/0'");

function getBtcKeyPair(index: number): BIP32Interface {
  return btcAccount.derive(0).derive(index);
}

function getEthPrivateKey(index: number): string {
  const child = ethAccount.derivePath(`0/${index}`);
  return child.privateKey;
}

// --------------- BTC sweep ---------------

const BTC_API = BTC_TESTNET
  ? "https://blockstream.info/signet/api"
  : "https://blockstream.info/api";

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean };
}

async function sweepBtc(userId: number, address: string) {
  if (!btcDest) return;

  const res = await fetch(`${BTC_API}/address/${address}/utxo`);
  if (!res.ok) {
    console.error(`  BTC: failed to fetch UTXOs for ${address}: ${res.status}`);
    return;
  }
  const utxos: UTXO[] = await res.json() as UTXO[];
  const confirmed = utxos.filter((u) => u.status.confirmed);
  if (confirmed.length === 0) {
    console.log(`  BTC: ${address} — no confirmed UTXOs, skipping`);
    return;
  }

  const totalSats = confirmed.reduce((s, u) => s + u.value, 0);
  console.log(`  BTC: ${address} — ${confirmed.length} UTXOs, ${totalSats} sats (${(totalSats / 1e8).toFixed(8)} BTC)`);

  if (dryRun) return;

  // Fetch fee rate (sat/vB)
  const feeRes = await fetch(`${BTC_API}/fee-estimates`);
  const feeData = (await feeRes.json()) as Record<string, number>;
  const feeRate = Math.ceil(feeData["6"] || feeData["3"] || 2); // target ~6 blocks, fallback 2 sat/vB

  const keyPair = getBtcKeyPair(userId);
  const psbt = new bitcoin.Psbt({ network: btcNetwork });

  for (const utxo of confirmed) {
    // Fetch raw tx hex for non-witness input
    const txHexRes = await fetch(`${BTC_API}/tx/${utxo.txid}/hex`);
    const txHex = await txHexRes.text();

    const p2wpkhOutput = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: btcNetwork,
    }).output!;

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: new Uint8Array(p2wpkhOutput),
        value: BigInt(utxo.value),
      },
    });
  }

  // Estimate tx size: ~68 vbytes base + ~31 per output + ~69 per segwit input
  const estimatedSize = 68 + 31 + confirmed.length * 69;
  const fee = estimatedSize * feeRate;

  if (totalSats <= fee) {
    console.log(`  BTC: dust balance (${totalSats} sats <= ${fee} fee), skipping`);
    return;
  }

  psbt.addOutput({ address: btcDest, value: BigInt(totalSats - fee) });

  for (let i = 0; i < confirmed.length; i++) {
    psbt.signInput(i, {
      publicKey: new Uint8Array(keyPair.publicKey),
      privateKey: new Uint8Array(keyPair.privateKey!),
      sign: (hash: Uint8Array) => new Uint8Array(ecc.sign(Buffer.from(hash), keyPair.privateKey!)),
    });
  }

  psbt.finalizeAllInputs();
  const txHex = psbt.extractTransaction().toHex();

  // Broadcast
  const broadcastRes = await fetch(`${BTC_API}/tx`, { method: "POST", body: txHex });
  if (broadcastRes.ok) {
    const txid = await broadcastRes.text();
    console.log(`  BTC: SWEPT ${(totalSats - fee) / 1e8} BTC → ${btcDest} | txid: ${txid} | fee: ${fee} sats`);
  } else {
    const err = await broadcastRes.text();
    console.error(`  BTC: broadcast failed: ${err}`);
  }
}

// --------------- ETH sweep ---------------

const ETH_RPC = process.env.ETH_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY";

async function sweepEth(userId: number, address: string) {
  if (!ethDest) return;

  const provider = new JsonRpcProvider(ETH_RPC);
  const balance = await provider.getBalance(address);

  if (balance === 0n) {
    console.log(`  ETH: ${address} — zero balance, skipping`);
    return;
  }

  console.log(`  ETH: ${address} — ${formatEther(balance)} ETH`);

  if (dryRun) return;

  const privateKey = getEthPrivateKey(userId);
  const wallet = new Wallet(privateKey, provider);

  // Estimate gas
  const feeData = await provider.getFeeData();
  const gasLimit = 21000n; // simple transfer
  const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const maxPriorityFee = feeData.maxPriorityFeePerGas ?? 0n;
  const gasCost = gasLimit * maxFeePerGas;

  if (balance <= gasCost) {
    console.log(`  ETH: dust balance (${formatEther(balance)} ETH <= ${formatEther(gasCost)} gas), skipping`);
    return;
  }

  const sendAmount = balance - gasCost;

  try {
    const tx = await wallet.sendTransaction({
      to: ethDest,
      value: sendAmount,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFee,
    });
    console.log(`  ETH: SWEPT ${formatEther(sendAmount)} ETH → ${ethDest} | tx: ${tx.hash} | gas: ${formatEther(gasCost)} ETH`);
    await tx.wait();
    console.log(`  ETH: confirmed`);
  } catch (err: any) {
    console.error(`  ETH: send failed: ${err.message}`);
  }
}

// --------------- Main ---------------

async function main() {
  console.log(`Mode: ${dryRun ? "DRY RUN (no transactions sent)" : "LIVE"}`);
  console.log(`Network: ${BTC_TESTNET ? "testnet" : "mainnet"}`);
  if (btcDest) console.log(`BTC destination: ${btcDest}`);
  if (ethDest) console.log(`ETH destination: ${ethDest}`);
  console.log();

  // Get all users who have confirmed deposits
  const users = await prisma.user.findMany({
    where: {
      transactions: {
        some: { status: "CONFIRMED" },
      },
    },
    select: { id: true, email: true, btcAddress: true, ethAddress: true },
  });

  if (users.length === 0) {
    console.log("No users with confirmed deposits found.");
    return;
  }

  console.log(`Found ${users.length} user(s) with confirmed deposits.\n`);

  for (const user of users) {
    console.log(`User #${user.id} (${user.email}):`);
    if (btcDest) await sweepBtc(user.id, user.btcAddress);
    if (ethDest) await sweepEth(user.id, user.ethAddress);
    console.log();
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
