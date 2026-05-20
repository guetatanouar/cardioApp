import bcrypt from 'bcryptjs';
import { query } from './pool.js';

async function seed() {
    try {
        console.log('Starting seed...');

        // Seed Staff
        const adminPass = await bcrypt.hash('admin123', 10);
        const secPass = await bcrypt.hash('sec123', 10);

        await query(
            `INSERT INTO users (username, email, password, name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (username) DO UPDATE SET email = $2, name = $4`,
            ['admin', 'p.moreau@cabinet-cardio.fr', adminPass, 'Dr. Pierre Moreau', 'admin', 'PM', 'Cardiologue',
             '01 23 45 67 89', '12 rue de la Paix, 75001 Paris', '12345678901', 'Cardiologue',
             'Kamel', 'Hadj']
        );
        await query(
            `INSERT INTO users (username, email, password, name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (username) DO UPDATE SET email = $2, name = $4`,
            ['secretaire', 's.dubois@cabinet-cardio.fr', secPass, 'Sophie Dubois', 'secretaire', 'SD', 'Secrétaire médicale',
             null, null, null, null, 'Sophie', 'Dubois']
        );

        // Seed Patients
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            ['p1', 'Jean', 'Dupont', '1955-10-12', 'M', 'A+', '0601020304', 'jean.dupont@email.com', '12 rue de la Paix, Paris', 'Marie Dupont (0602030405)', '{"Pénicilline"}', '{"HTA", "Diabète type 2"}']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            ['p2', 'Claire', 'Martin', '1962-03-25', 'F', 'O-', '0611121314', 'claire.martin@email.com', '5 av des Fleurs, Lyon', 'Paul Martin (0612131415)', '{}', '{"Insuffisance cardiaque"}']
        );

        // Seed Patient Accounts
        const jeanPass = await bcrypt.hash('jean123', 10);
        const clairePass = await bcrypt.hash('claire123', 10);
        await query(
            `INSERT INTO patient_accounts (patient_id, username, password)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p1', 'jean.dupont', jeanPass]
        );
        await query(
            `INSERT INTO patient_accounts (patient_id, username, password)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p2', 'claire.martin', clairePass]
        );

        // Seed Secretaire Permissions (all granted)
        const secUser = await query('SELECT id FROM users WHERE username = $1', ['secretaire']);
        if (secUser.rows.length > 0) {
            const secUserId = secUser.rows[0].id;
            await query(
                `INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_delete_patients,
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
                    can_view_consultations = true`,
                [secUserId]
            );
        }

        console.log('Seed completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
