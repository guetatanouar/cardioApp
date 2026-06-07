"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const pool_js_1 = require("./pool.js");
async function seed() {
    try {
        console.log('Starting seed...');
        // Seed Staff
        const adminPass = await bcryptjs_1.default.hash('admin123', 10);
        const secPass = await bcryptjs_1.default.hash('sec123', 10);
        await (0, pool_js_1.query)(`INSERT INTO users (id, username, email, password_hash, full_name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`, ['1', 'admin', 'p.moreau@cabinet-cardio.fr', adminPass, 'Dr. Pierre Moreau', 'admin', 'PM', 'Cardiologue',
            '01 23 45 67 89', '12 rue de la Paix, 75001 Paris', '12345678901', 'Cardiologue',
            'Kamel', 'Hadj']);
        await (0, pool_js_1.query)(`INSERT INTO users (id, username, email, password_hash, full_name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`, ['2', 'secretaire', 's.dubois@cabinet-cardio.fr', secPass, 'Sophie Dubois', 'secretaire', 'SD', 'Secrétaire médicale',
            null, null, null, null, 'Sophie', 'Dubois']);
        // Seed Patients
        await (0, pool_js_1.query)(`INSERT INTO patients (id, first_name, last_name, date_of_birth, blood_type, phone, email, address, emergency_contact, allergies, medical_history)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING`, ['p1', 'Jean', 'Dupont', '1955-10-12', 'A+', '0601020304', 'jean.dupont@email.com', '12 rue de la Paix, Paris', 'Marie Dupont - 0602030405', 'Pénicilline', 'HTA, Diabète type 2']);
        await (0, pool_js_1.query)(`INSERT INTO patients (id, first_name, last_name, date_of_birth, blood_type, phone, email, address, emergency_contact, allergies, medical_history)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING`, ['p2', 'Claire', 'Martin', '1962-03-25', 'O-', '0611121314', 'claire.martin@email.com', '5 av des Fleurs, Lyon', 'Paul Martin - 0612131415', null, 'Insuffisance cardiaque']);
        // Seed Patient Accounts
        const jeanPass = await bcryptjs_1.default.hash('jean123', 10);
        const clairePass = await bcryptjs_1.default.hash('claire123', 10);
        await (0, pool_js_1.query)(`INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`, ['p1', 'jean.dupont', jeanPass]);
        await (0, pool_js_1.query)(`INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`, ['p2', 'claire.martin', clairePass]);
        // Seed Documents for testing Analyse module
        await (0, pool_js_1.query)(`INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['doc_1', 'p1', 'ECG - Jean Dupont', 'analyse', '1.2 KB', 'uploads/ecg-jean-dupont.txt']);
        await (0, pool_js_1.query)(`INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['doc_2', 'p1', 'Bilan sanguin - Jean Dupont', 'analyse', '0.8 KB', 'uploads/bilan-sanguin-jean-dupont.txt']);
        await (0, pool_js_1.query)(`INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['doc_3', 'p2', 'Échocardiographie - Claire Martin', 'echographie', '1.0 KB', 'uploads/echocardio-claire-martin.txt']);
        await (0, pool_js_1.query)(`INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['doc_4', 'p2', 'Holter 24h - Claire Martin', 'analyse', '0.9 KB', 'uploads/holter-claire-martin.txt']);
        // Seed Secretaire Permissions (all granted)
        const secUser = await (0, pool_js_1.query)('SELECT id FROM users WHERE username = $1', ['secretaire']);
        if (secUser.rows.length > 0) {
            const secUserId = secUser.rows[0].id;
            await (0, pool_js_1.query)(`INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_delete_patients,
                    can_view_appointments, can_edit_appointments, can_delete_appointments,
                    can_view_chat, can_send_chat,
                    can_view_prescriptions, can_edit_prescriptions,
                    can_view_vitals, can_edit_vitals,
                    can_view_documents, can_upload_documents,
                    can_view_consultations)
                 VALUES ($1, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true)
                 ON CONFLICT (user_id) DO UPDATE SET
                    can_view_patients = true, can_edit_patients = true, can_delete_patients = true,
                    can_view_appointments = true, can_edit_appointments = true, can_delete_appointments = true,
                    can_view_chat = true, can_send_chat = true,
                    can_view_prescriptions = true, can_edit_prescriptions = true,
                    can_view_vitals = true, can_edit_vitals = true,
                    can_view_documents = true, can_upload_documents = true,
                    can_view_consultations = true`, [secUserId]);
        }
        console.log('Seed completed successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}
seed();
