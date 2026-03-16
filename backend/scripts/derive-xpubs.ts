/**
 * Derive xpub/tpub, ETH xpub, and TRON xpub from a BIP39 mnemonic.
 *
 * Usage:
 *   npx tsx scripts/derive-xpubs.ts "your twelve word mnemonic phrase here"
 *   npx tsx scripts/derive-xpubs.ts --testnet "your twelve word mnemonic phrase here"
 */

import * as bip39 from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { HDNodeWallet } from "ethers";

const bip32 = BIP32Factory(ecc);

const args = process.argv.slice(2);
const testnet = args.includes("--testnet");
const mnemonic = args.filter((a) => a !== "--testnet").join(" ");

if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
  console.error(
    'Usage: npx tsx scripts/derive-xpubs.ts [--testnet] "mnemonic words ..."',
  );
  process.exit(1);
}

const seed = bip39.mnemonicToSeedSync(mnemonic);

// BTC: BIP84 (native segwit) — m/84'/0'/0' (mainnet) or m/84'/1'/0' (testnet)
const btcNetwork = testnet
  ? bitcoin.networks.testnet
  : bitcoin.networks.bitcoin;
const btcCoinType = testnet ? 1 : 0;
const btcRoot = bip32.fromSeed(seed, btcNetwork);
const btcAccount = btcRoot.derivePath(`m/84'/${btcCoinType}'/0'`);
const btcXpub = btcAccount.neutered().toBase58();

// ETH: BIP44 — m/44'/60'/0'
const ethRoot = HDNodeWallet.fromSeed(seed);
const ethAccount = ethRoot.derivePath("m/44'/60'/0'");
const ethXpub = ethAccount.neuter().extendedKey;

// TRON: BIP44 — m/44'/195'/0'
const tronAccount = ethRoot.derivePath("m/44'/195'/0'");
const tronXpub = tronAccount.neuter().extendedKey;

console.log(`Network: ${testnet ? "testnet" : "mainnet"}\n`);
console.log(`BTC_XPUB=${btcXpub}`);
console.log(`ETH_XPUB=${ethXpub}`);
console.log(`TRON_XPUB=${tronXpub}`);
console.log(
  `\nBTC xpub prefix: ${btcXpub.slice(0, 4)} (${testnet ? "tpub = testnet" : "xpub = mainnet"})`,
);
