import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const { Pool } = pg;
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
export const query = (text, params) => {
    return pool.query(text, params);
};
