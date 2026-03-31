import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const schemaPath = path.resolve("db", "schema.sql");
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
