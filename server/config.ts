import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";

const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
const resolvedEnvPath = process.env.DOTENV_CONFIG_PATH ?? envFile;
const dotenvResult = dotenv.config({ path: resolvedEnvPath });
if (dotenvResult.error) {
  console.warn(`Unable to load .env file at ${resolvedEnvPath}:`, dotenvResult.error);
} else {
  console.debug(`Loaded .env from ${resolvedEnvPath}`);
}

function getEnv(key: string, defaultValue?: string, isRequired = false): string {
  const value = process.env[key];
  if (!value && isRequired) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || "";
}

export const config = {
  // Server Configuration
  server: {
    port: Number(getEnv("PORT", "4000")),
    nodeEnv: getEnv("NODE_ENV", "development") as "development" | "production" | "test" | "local",
    isDev: getEnv("NODE_ENV", "development") !== "production"
  },

  // Database Configuration
  database: {
    url: getEnv("DATABASE_URL", "", true),
    adminDb: getEnv("PG_ADMIN_DB", "postgres")
  },

  // Authentication
  auth: {
    jwtSecret: getEnv("JWT_SECRET", "replace-with-long-random-secret", true),
    tokenExpiresIn: getEnv("JWT_EXPIRES_IN", "7d")
  },

  // CORS Configuration
  cors: {
    origin: getEnv("CORS_ORIGIN", "http://localhost:3000").split(",").map(s => s.trim())
  },

  // File Uploads
  uploads: {
    maxFileSize: Number(getEnv("MAX_FILE_SIZE", "10485760")), // 10MB default
    uploadDir: getEnv("UPLOAD_DIR", "uploads")
  }
} as const;

export type Config = typeof config;

// Validate critical env vars on startup
export function validateConfig() {
  const errors: string[] = [];

  if (!config.database.url) {
    errors.push("DATABASE_URL is required");
  }

  if (!config.auth.jwtSecret || config.auth.jwtSecret === "replace-with-long-random-secret") {
    errors.push("JWT_SECRET must be set to a strong secret");
  }

  if (errors.length > 0) {
    console.error("Configuration validation failed:");
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}
