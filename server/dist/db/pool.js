import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const url = process.env.DATABASE_URL;
if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}
const { Pool } = pg;
export const pool = new Pool({
    connectionString: url,
});
export const query = (text, params) => {
    return pool.query(text, params);
};
