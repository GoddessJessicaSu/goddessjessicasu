import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { HDNodeWallet } from "ethers";
import crypto from "crypto";
import { config } from "../config";

const bip32 = BIP32Factory(ecc);

// BTC: derive from xpub using BIP44 path
// Address format (bc1 vs tb1) is determined by the xpub type, not CRYPTO_NETWORK.
// CRYPTO_NETWORK only controls API URLs and contract addresses.
export function deriveBtcAddress(index: number): string {
  const network = config.crypto.btcXpub.startsWith("tpub")
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

  const node = bip32.fromBase58(config.crypto.btcXpub, network);
  const child = node.derive(0).derive(index);
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network,
  });
  if (!address) throw new Error("Failed to derive BTC address");
  return address;
}

// ETH + USDT(ERC20): derive from xpub using BIP44 path
// Same address is used for both native ETH and ERC-20 USDT
export function deriveEthAddress(index: number): string {
  const node = HDNodeWallet.fromExtendedKey(config.crypto.ethXpub);
  const child = node.derivePath(`0/${index}`);
  return child.address;
}

// TRON / USDT(TRC20): derive from xpub
export function deriveTronAddress(index: number): string {
  const node = HDNodeWallet.fromExtendedKey(config.crypto.tronXpub);
  const child = node.derivePath(`0/${index}`);
  const ethAddr = child.address;
  const addrBytes = Buffer.from(ethAddr.slice(2), "hex");
  const tronBytes = Buffer.concat([Buffer.from([0x41]), addrBytes]);
  return base58CheckEncode(tronBytes);
}

function base58CheckEncode(payload: Buffer): string {
  const hash1 = crypto.createHash("sha256").update(payload).digest();
  const hash2 = crypto.createHash("sha256").update(hash1).digest();
  const checksum = hash2.subarray(0, 4);
  const full = Buffer.concat([payload, checksum]);
  return base58Encode(full);
}

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(buffer: Buffer): string {
  let num = BigInt("0x" + buffer.toString("hex"));
  const chars: string[] = [];
  while (num > 0n) {
    const remainder = Number(num % 58n);
    chars.unshift(BASE58_ALPHABET[remainder]);
    num = num / 58n;
  }
  for (const byte of buffer) {
    if (byte === 0) chars.unshift("1");
    else break;
  }
  return chars.join("");
}

export function deriveAllAddresses(userId: number) {
  return {
    btcAddress: deriveBtcAddress(userId),
    ethAddress: deriveEthAddress(userId),
    tronAddress: deriveTronAddress(userId),
  };
}
