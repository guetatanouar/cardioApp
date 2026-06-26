import { query } from './pool.js';
async function migrate() {
    try {
        console.log('Starting migration...');
        // Add profile columns to users table (safe to run multiple times)
        const alterCols = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS rpps VARCHAR(20)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(150)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)",
            "ALTER TABLE patient_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
            "ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ecole VARCHAR(200)"
        ];
        for (const col of alterCols) {
            try {
                await query(col);
            }
            catch { /* column may already exist */ }
        }
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();
