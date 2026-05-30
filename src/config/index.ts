import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 4000),
  baseUrl: process.env.BASE_URL ?? "http://localhost:4000",
  mongoUri: process.env.MONGO_URI ?? "",
  mongoDbName: process.env.MONGO_DB_NAME ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtIssuer: process.env.JWT_ISSUER ?? "the-expose",
  jwtAudience: process.env.JWT_AUDIENCE ?? "admin",
  jwtExpiresInSeconds: parseNumber(process.env.JWT_EXPIRES_IN, 900),
  siweDomain: process.env.SIWE_DOMAIN ?? "",
  siweDomains: (process.env.SIWE_DOMAINS ?? process.env.SIWE_DOMAIN ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  siweStatement: process.env.SIWE_STATEMENT ?? "",
  siweUri: process.env.SIWE_URI ?? "",
  siweExpirationSeconds: parseNumber(process.env.SIWE_EXPIRATION_SECONDS, 600),
  adminWalletAllowlist: (process.env.ADMIN_WALLET_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  sharpTempDir: process.env.SHARP_TEMP_DIR ?? "./tmp",
  rateLimitPoints: parseNumber(process.env.RATE_LIMIT_POINTS, 300),
  rateLimitDuration: parseNumber(process.env.RATE_LIMIT_DURATION, 60),
  rateLimitBlock: parseNumber(process.env.RATE_LIMIT_BLOCK, 10),
  logLevel: process.env.LOG_LEVEL ?? "info",
  logPretty: process.env.LOG_PRETTY === "true",
  cacheTtlSeconds: parseNumber(process.env.CACHE_TTL_SECONDS, 300),
  pollVoteTtlSeconds: parseNumber(process.env.POLL_VOTE_TTL_SECONDS, 604800),
  submissionRateLimitPoints: parseNumber(process.env.SUBMISSION_RATE_LIMIT_POINTS, 5),
  submissionRateLimitDuration: parseNumber(process.env.SUBMISSION_RATE_LIMIT_DURATION, 86400),
  submissionRateLimitBlock: parseNumber(process.env.SUBMISSION_RATE_LIMIT_BLOCK, 86400),
  uploadRateLimitPoints: parseNumber(process.env.UPLOAD_RATE_LIMIT_POINTS, 20),
  uploadRateLimitDuration: parseNumber(process.env.UPLOAD_RATE_LIMIT_DURATION, 86400),
  uploadRateLimitBlock: parseNumber(process.env.UPLOAD_RATE_LIMIT_BLOCK, 86400),
  pollVoteRateLimitPoints: parseNumber(process.env.POLL_VOTE_RATE_LIMIT_POINTS, 30),
  pollVoteRateLimitDuration: parseNumber(process.env.POLL_VOTE_RATE_LIMIT_DURATION, 3600),
  pollVoteRateLimitBlock: parseNumber(process.env.POLL_VOTE_RATE_LIMIT_BLOCK, 3600),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER ?? "the-expose/submissions",
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
