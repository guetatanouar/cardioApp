import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? envFile });
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
    throw new Error("Missing DATABASE_URL in apps/api/.env");
}
let dbUrl;
try {
    dbUrl = new URL(connectionString);
}
catch {
    throw new Error("Invalid DATABASE_URL format in apps/api/.env");
}
const dbPassword = decodeURIComponent(dbUrl.password ?? "");
if (!dbPassword || dbPassword === "YOUR_POSTGRES_PASSWORD") {
    throw new Error("DATABASE_URL must contain your real PostgreSQL password. If your password has special characters, URL-encode it.");
}
export const pool = new Pool({
    connectionString
});
export async function query(text, params) {
    return pool.query(text, params);
}
