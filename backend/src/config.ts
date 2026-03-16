function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const cryptoNetwork = optional("CRYPTO_NETWORK", "mainnet") as
  | "mainnet"
  | "testnet";

export const config = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: parseInt(optional("PORT", "4000"), 10),

  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  adminEmail: required("ADMIN_EMAIL"),

  resend: {
    apiKey: required("RESEND_API_KEY"),
    fromEmail: required("RESEND_FROM_EMAIL"),
  },

  minio: {
    endpoint: required("MINIO_ENDPOINT"),
    port: parseInt(optional("MINIO_PORT", "9000"), 10),
    rootUser: required("MINIO_ROOT_USER"),
    rootPassword: required("MINIO_ROOT_PASSWORD"),
    buckets: {
      siteAssets: "site-assets",
      previewImages: "preview-images",
      previewVideos: "preview-videos",
      products: "products",
    },
    presignExpiry: parseInt(optional("MINIO_PRESIGN_EXPIRY", "3600"), 10),
    publicUrl: process.env.MINIO_PUBLIC_URL || "",
  },

  crypto: {
    network: cryptoNetwork,
    btcXpub: required("BTC_XPUB"),
    ethXpub: required("ETH_XPUB"),
    tronXpub: required("TRON_XPUB"),
    pollIntervalMs: parseInt(optional("CRYPTO_POLL_INTERVAL_MS", "60000"), 10),
    tokenRatePerUsd: parseFloat(optional("TOKEN_RATE_PER_USD", "100")),
    usdtTrc20Contract: optional(
      "USDT_TRC20_CONTRACT",
      cryptoNetwork === "testnet"
        ? "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf"
        : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    ),
  },

  blockchain: {
    btcApiUrl: optional(
      "BTC_API_URL",
      cryptoNetwork === "testnet"
        ? "https://blockstream.info/signet/api"
        : "https://blockstream.info/api",
    ),
    ethRpcUrl: optional(
      "ETH_RPC_URL",
      cryptoNetwork === "testnet"
        ? "https://sepolia.infura.io/v3/YOUR_KEY"
        : "https://mainnet.infura.io/v3/YOUR_KEY",
    ),
    tronApiUrl: optional(
      "TRON_API_URL",
      cryptoNetwork === "testnet"
        ? "https://nile.trongrid.io"
        : "https://api.trongrid.io",
    ),
    ethExplorerApiUrl: optional(
      "ETH_EXPLORER_API_URL",
      cryptoNetwork === "testnet"
        ? "https://eth-sepolia.blockscout.com/api"
        : "https://eth.blockscout.com/api",
    ),
  },

  logLevel: optional("LOG_LEVEL", "info"),

  get isDev() {
    return this.nodeEnv === "development";
  },
};
