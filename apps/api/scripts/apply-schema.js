import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? envFile });

const { Client } = pg;

const schemaPath = path.resolve(__dirname, "..", "db", "schema.sql");
const sql = fs.readFileSync(schemaPath, "utf8");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query(sql);
  // eslint-disable-next-line no-console
  console.log("Schema applied");
} finally {
  await client.end();
}
