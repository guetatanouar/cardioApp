import fs from 'fs';
import path from 'path';
import { query } from './pool.js';
async function migrate() {
    try {
        console.log('Starting migration...');
        // Read schema from project root
        const schemaPath = path.resolve(process.cwd(), '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        // Drop all existing tables in correct order (respecting FK constraints)
        await query('DROP TABLE IF EXISTS patient_accounts CASCADE');
        await query('DROP TABLE IF EXISTS notifications CASCADE');
        await query('DROP TABLE IF EXISTS analysis_reports CASCADE');
        await query('DROP TABLE IF EXISTS chat_messages CASCADE');
        await query('DROP TABLE IF EXISTS prescriptions CASCADE');
        await query('DROP TABLE IF EXISTS appointments CASCADE');
        await query('DROP TABLE IF EXISTS documents CASCADE');
        await query('DROP TABLE IF EXISTS consultations CASCADE');
        await query('DROP TABLE IF EXISTS vital_entries CASCADE');
        await query('DROP TABLE IF EXISTS secretaire_permissions CASCADE');
        await query('DROP TABLE IF EXISTS patients CASCADE');
        await query('DROP TABLE IF EXISTS users CASCADE');
        // Execute schema.sql
        await query(schema);
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();
