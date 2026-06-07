"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_js_1 = require("./pool.js");
async function migrate() {
    try {
        console.log('Starting migration...');
        // Read schema from project root
        const schemaPath = path_1.default.resolve(process.cwd(), '..', 'schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
        // Drop all existing tables in correct order (respecting FK constraints)
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS patient_accounts CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS notifications CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS analysis_reports CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS chat_messages CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS prescriptions CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS appointments CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS documents CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS consultations CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS vital_entries CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS secretaire_permissions CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS patients CASCADE');
        await (0, pool_js_1.query)('DROP TABLE IF EXISTS users CASCADE');
        // Execute schema.sql
        await (0, pool_js_1.query)(schema);
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();
