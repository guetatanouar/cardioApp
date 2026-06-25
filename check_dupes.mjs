import { query } from './server/db/pool.js';
const r = await query(`SELECT phone, COUNT(*) FROM patients GROUP BY phone HAVING COUNT(*) > 1`);
console.log('Duplicate phones:', JSON.stringify(r.rows, null, 2));
const r2 = await query(`SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name='patients'`);
console.log('Patient constraints:', JSON.stringify(r2.rows, null, 2));
process.exit(0);
