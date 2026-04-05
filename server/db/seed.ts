import bcrypt from 'bcryptjs';
import { query } from './pool.js';

async function seed() {
    try {
        console.log('Starting seed...');
        
        // Seed Staff
        const adminPass = await bcrypt.hash('admin123', 10);
        const secPass = await bcrypt.hash('sec123', 10);
        
        await query(
            'INSERT INTO users (username, email, password, name, role, initials, title) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            ['admin', 'p.moreau@cabinet-cardio.fr', adminPass, 'Dr. Pierre Moreau', 'admin', 'PM', 'Cardiologue']
        );
        await query(
            'INSERT INTO users (username, email, password, name, role, initials, title) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            ['secretaire', 's.dubois@cabinet-cardio.fr', secPass, 'Sophie Dubois', 'secretaire', 'SD', 'Secrétaire médicale']
        );

        // Seed Patients
        await query(
            'INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            ['p1', 'Jean', 'Dupont', '1955-10-12', 'M', 'A+', '0601020304', 'jean.dupont@email.com', '12 rue de la Paix, Paris', 'Marie Dupont (0602030405)', '{"Pénicilline"}', '{"HTA", "Diabète type 2"}']
        );
        await query(
            'INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            ['p2', 'Claire', 'Martin', '1962-03-25', 'F', 'O-', '0611121314', 'claire.martin@email.com', '5 av des Fleurs, Lyon', 'Paul Martin (0612131415)', '{}', '{"Insuffisance cardiaque"}']
        );

        // Seed Patient Accounts
        const jeanPass = await bcrypt.hash('jean123', 10);
        const clairePass = await bcrypt.hash('claire123', 10);
        await query(
            'INSERT INTO patient_accounts (patient_id, username, password) VALUES ($1, $2, $3)',
            ['p1', 'jean.dupont', jeanPass]
        );
        await query(
            'INSERT INTO patient_accounts (patient_id, username, password) VALUES ($1, $2, $3)',
            ['p2', 'claire.martin', clairePass]
        );

        console.log('Seed completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
