import dotenv from "dotenv";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? envFile });

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const dbUrl = new URL(connectionString);
const targetDb = dbUrl.pathname.replace(/^\//, "");
if (!targetDb) {
  throw new Error("DATABASE_URL must include a database name in its path");
}

const adminDb = process.env.PG_ADMIN_DB ?? "postgres";
const adminUrl = new URL(connectionString);
adminUrl.pathname = `/${adminDb}`;

const client = new Client({ connectionString: adminUrl.toString() });
try {
  await client.connect();
} catch (error) {
  throw new Error(
    `Failed to connect to PostgreSQL with DATABASE_URL. Update apps/api/.env with the correct username/password.\nOriginal error: ${String(error)}`
  );
}

try {
  if (targetDb === adminDb) {
    // eslint-disable-next-line no-console
    console.log(`DB bootstrap skipped: target database is already '${adminDb}'`);
  } else {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1", [targetDb]);

    if (exists.rowCount && exists.rowCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`Database already exists: ${targetDb}`);
    } else {
      const quotedDbName = `"${targetDb.replace(/"/g, '""')}"`;
      await client.query(`CREATE DATABASE ${quotedDbName}`);
      // eslint-disable-next-line no-console
      console.log(`Database created: ${targetDb}`);
    }
  }
} finally {
  await client.end();
}
