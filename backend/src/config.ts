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

  nowpayments: {
    apiKey: required("NOWPAYMENTS_API_KEY"),
    ipnSecret: required("NOWPAYMENTS_IPN_SECRET"),
    callbackUrl: optional("NOWPAYMENTS_CALLBACK_URL", ""),
    apiBaseUrl: "https://api.nowpayments.io/v1",
  },

  logLevel: optional("LOG_LEVEL", "info"),

  get isDev() {
    return this.nodeEnv === "development";
  },
};
