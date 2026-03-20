function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

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

  storj: {
    endpoint: required("STORJ_ENDPOINT"),
    accessKeyId: required("STORJ_ACCESS_KEY_ID"),
    secretAccessKey: required("STORJ_SECRET_ACCESS_KEY"),
    bucket: optional("STORJ_BUCKET", "jessica-su"),
    prefixes: {
      siteAssets: "site-assets",
      previewImages: "preview-images",
      previewVideos: "preview-videos",
      products: "products",
    },
    presignExpiry: parseInt(optional("STORJ_PRESIGN_EXPIRY", "14400"), 10),
  },

  nowpayments: {
    apiKey: required("NOWPAYMENTS_API_KEY"),
    ipnSecret: required("NOWPAYMENTS_IPN_SECRET"),
    callbackUrl: optional("NOWPAYMENTS_CALLBACK_URL", ""),
    apiBaseUrl: "https://api.nowpayments.io/v1",
  },

  frontendUrl: optional("FRONTEND_URL", "http://localhost:3000"),

  logLevel: optional("LOG_LEVEL", "info"),

  get isDev() {
    return this.nodeEnv === "development";
  },
};
