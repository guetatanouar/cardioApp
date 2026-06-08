import bcrypt from 'bcryptjs';
import { query } from './pool.js';

function ago(interval: string) {
    const m = interval.match(/(\d+)\s+(\w+)/);
    if (!m) return new Date().toISOString();
    const n = parseInt(m[1]);
    const ms: Record<string, number> = {hour: 3600000, hours: 3600000, day: 86400000, days: 86400000, week: 604800000, weeks: 604800000};
    return new Date(Date.now() - n * (ms[m[2]!] || 0)).toISOString();
}

function dateOff(expr: string) {
    const d = new Date();
    if (expr === 'today') return d.toISOString().split('T')[0];
    const m = expr.match(/([+-])\s*(\d+)\s+(\w+)/);
    if (!m) return d.toISOString().split('T')[0];
    const sign = m[1] === '-' ? -1 : 1;
    const n = parseInt(m[2]) * sign;
    const ms: Record<string, number> = {hour: 3600000, hours: 3600000, day: 86400000, days: 86400000, week: 604800000, weeks: 604800000};
    return new Date(d.getTime() + n * (ms[m[3]!] || 0)).toISOString().split('T')[0];
}

async function seed() {
    try {
        console.log('Starting seed...');

        await query('TRUNCATE TABLE analysis_reports, chat_messages, documents, prescriptions, appointments, consultations, vital_entries, patient_accounts, patients, secretaire_permissions, users RESTART IDENTITY CASCADE');

        const adminPass = await bcrypt.hash('admin123', 10);
        const secPass = await bcrypt.hash('sec123', 10);

        await query(
            `INSERT INTO users (id, username, email, password_hash, full_name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`,
            ['1', 'admin', 'e.tremblay@cardiologie-mtl.ca', adminPass, 'Dr. Étienne Tremblay', 'admin', 'ET', 'Cardiologue',
             '+1-514-555-1000', '4850 Boulevard de Maisonneuve O, Montréal, QC H3Z 1M1', '12345678901', 'Cardiologie',
             'Étienne', 'Tremblay']
        );
        await query(
            `INSERT INTO users (id, username, email, password_hash, full_name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`,
            ['2', 'secretaire', 'mc.gagnon@cardiologie-mtl.ca', secPass, 'Marie-Claude Gagnon', 'secretaire', 'MCG', 'Secrétaire médicale',
             '+1-514-555-1001', '200 Rue Sainte-Catherine O, Montréal, QC H2X 3Y2', null, null, 'Marie-Claude', 'Gagnon']
        );

        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p1', 'Gérard', 'Bouchard', '1952-08-15', 'M', 'A+', '+1-514-555-0101', 'gerard.bouchard@email.ca',
             '4850 Boulevard de Maisonneuve O, Montréal, QC H3Z 1M1', 'Canada',
             'Mme Bouchard - +1-514-555-0102', 'Pénicilline', 'Hypertension artérielle diagnostiquée en 2010',
             'Hypertension', 'stable']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p2', 'Sylvie', 'Roy', '1960-04-22', 'F', 'O-', '+1-418-555-0202', 'sylvie.roy@email.ca',
             '125 Rue Saint-Jean, Québec, QC G1R 1P2', 'Canada',
             'M. Roy - +1-418-555-0203', 'Aucune', 'Fibrillation auriculaire paroxystique',
             'Arythmie', 'stable']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p3', 'Michel', 'Leblanc', '1945-11-30', 'M', 'B+', '+1-416-555-0303', 'michel.leblanc@email.ca',
             '350 King Street W, Toronto, ON M5V 3X9', 'Canada',
             'Mme Leblanc - +1-416-555-0304', 'Iode, Sulfamides', 'Pontage aortocoronarien en 2018, IDM antérieur en 2020',
             'Post-infarctus', 'critique']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p4', 'Caroline', 'Côté', '1978-02-14', 'F', 'AB+', '+1-604-555-0404', 'caroline.cote@email.ca',
             '850 West Hastings St, Vancouver, BC V6C 1E1', 'Canada',
             'M. Côté - +1-604-555-0405', 'Aucune', 'Asthme léger, anxiété',
             'Tachycardie sinusale', 'surveillance']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p5', 'Alexandre', 'Bergeron', '1985-07-09', 'M', 'A-', '+1-403-555-0505', 'alex.bergeron@email.ca',
             '150 9th Ave SW, Calgary, AB T2P 2S5', 'Canada',
             'Mme Bergeron - +1-403-555-0506', 'Pollens', 'Aucun antécédent cardiaque',
             'Palpitations', 'stable']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p6', 'Robert', 'Ouellet', '1940-03-18', 'M', 'O+', '+1-514-555-0606', 'robert.ouellet@email.ca',
             '1200 Rue Sherbrooke E, Montréal, QC H2L 1L6', 'Canada',
             'Mme Ouellet - +1-514-555-0607', 'AAS', 'Insuffisance cardiaque congestive, MPOC',
             'Insuffisance cardiaque décompensée', 'critique']
        );
        await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            ['p7', 'Nathalie', 'Pelletier', '1972-09-25', 'F', 'B-', '+1-613-555-0707', 'nathalie.pelletier@email.ca',
             '200 Elgin Street, Ottawa, ON K2P 1L5', 'Canada',
             'M. Pelletier - +1-613-555-0708', 'Sulfamides', 'Diabète de type 2 depuis 2015, HTA',
             'Diabète type 2 + HTA', 'surveillance']
        );

        const p1Pass = await bcrypt.hash('gerard123', 10);
        const p2Pass = await bcrypt.hash('sylvie123', 10);
        const p3Pass = await bcrypt.hash('michel123', 10);
        const p4Pass = await bcrypt.hash('caroline123', 10);
        const p5Pass = await bcrypt.hash('alex123', 10);

        await query(
            `INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p1', 'gerard.bouchard', p1Pass]
        );
        await query(
            `INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p2', 'sylvie.roy', p2Pass]
        );
        await query(
            `INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p3', 'michel.leblanc', p3Pass]
        );
        await query(
            `INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p4', 'caroline.cote', p4Pass]
        );
        await query(
            `INSERT INTO patient_accounts (patient_id, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING`,
            ['p5', 'alexandre.bergeron', p5Pass]
        );

        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v1', 'p1', ago('1 day'), 135, 85, 72, 98, 78.5]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v2', 'p1', ago('1 week'), 142, 88, 76, 97, 79.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v3', 'p2', ago('2 days'), 128, 78, 68, 97, 62.5]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v4', 'p2', ago('2 weeks'), 132, 80, 70, 98, 63.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v5', 'p3', ago('5 hours'), 155, 95, 112, 91, 88.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v6', 'p3', ago('3 days'), 148, 92, 108, 93, 87.5]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v7', 'p4', ago('1 day'), 118, 72, 108, 98, 55.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v8', 'p4', ago('1 week'), 122, 74, 105, 99, 55.5]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v9', 'p5', ago('12 hours'), 120, 75, 65, 98, 72.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v10', 'p5', ago('2 days'), 118, 72, 62, 99, 71.5]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v11', 'p6', ago('4 hours'), 160, 100, 95, 88, 95.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v12', 'p6', ago('1 week'), 155, 98, 92, 90, 94.5]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v13', 'p7', ago('3 days'), 142, 88, 78, 96, 70.0]
        );
        await query(
            `INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['v14', 'p7', ago('5 days'), 138, 85, 75, 97, 69.5]
        );

        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c1', 'p1', '1', '2024-12-15', 'Suivi trimestriel HTA',
             'ECG normal, TA 135/85, auscultation cardiaque normale',
             'Hypertension artérielle contrôlée',
             'Maintien Amlodipine 5mg et Ramipril 10mg',
             'Patient asymptomatique. Bonne observance thérapeutique.',
             'Dr. Étienne Tremblay']
        );
        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c2', 'p2', '1', '2024-12-18', 'Palpitations nocturnes',
             'Holter 24h posé, ECG 12 dérivations normal',
             'Suspicion de fibrillation auriculaire paroxystique',
             'Apixaban 5mg BID, Bisoprolol 2.5mg die',
             'Revoir après résultats Holter. Anticoagulation débutée.',
             'Dr. Étienne Tremblay']
        );
        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c3', 'p3', '1', '2024-11-28', 'Douleur thoracique retrosternale',
             'ECG avec sus-décalage ST en V3-V4, troponines élevées',
             'Infarctus du myocarde antérieur aigu',
             'Angioplastie + stent, AAS 80mg, Clopidogrel 75mg, Atorvastatine 40mg',
             'Hospitalisation en soins intensifs. Évolution favorable.',
             'Dr. Étienne Tremblay']
        );
        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c4', 'p4', '1', '2024-12-20', 'Tachycardie et palpitations',
             'ECG montre tachycardie sinusale à 108/min, échocardiographie normale',
             'Tachycardie sinusale inappropriée',
             'Bisoprolol 1.25mg die, avis cardiopédiatrique',
             'À surveiller. Éliminer cause thyroïdienne.',
             'Dr. Étienne Tremblay']
        );
        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c5', 'p5', '1', '2024-12-10', 'Palpitations depuis 3 mois',
             'Holter normal, ECG normal, échocardiographie normale',
             'Palpitations bénignes probablement liées au stress',
             'Aucun traitement. Techniques de relaxation conseillées.',
             'Patient jeune et sportif. Pas de cardiopathie sous-jacente.',
             'Dr. Étienne Tremblay']
        );
        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c6', 'p6', '1', '2024-12-22', 'Dyspnée d\'effort croissante',
             'Échocardiographie montre FEVG 35%, crépitants pulmonaires',
             'Insuffisance cardiaque congestive décompensée',
             'Furosémide 40mg die, Enalapril 5mg die, Spironolactone 25mg die',
             'Patient âgé, surveillance rapprochée. Suivi diététique.',
             'Dr. Étienne Tremblay']
        );
        await query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            ['c7', 'p7', '1', '2024-12-19', 'Suivi diabète et HTA',
             'TA 142/88, HbA1c 7.2%, ECG normal',
             'Diabète type 2 partiellement contrôlé. HTA légère.',
             'Metformine 500mg BID, Lisinopril 10mg die, régime hyposodé',
             'Encourager activité physique modérée. Contrôle dans 3 mois.',
             'Dr. Étienne Tremblay']
        );

        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a1', 'p1', dateOff('today'), '09:00', 30, 'suivi', 'scheduled', 'Contrôle tension artérielle']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a2', 'p2', dateOff('today'), '10:30', 45, 'echographie', 'scheduled', 'Écho-doppler cardiaque de contrôle']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a3', 'p6', dateOff('today'), '14:00', 60, 'urgence', 'scheduled', 'Dyspnée aiguë - décompensation cardiaque']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a4', 'p4', dateOff('+ 1 day'), '09:00', 30, 'consultation', 'scheduled', 'Consultation tachycardie']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a5', 'p7', dateOff('+ 1 day'), '11:00', 30, 'suivi', 'scheduled', 'Suivi diabète et HTA']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a6', 'p3', dateOff('+ 1 day'), '15:30', 45, 'suivi', 'scheduled', 'Post-hospitalisation contrôle']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a7', 'p1', dateOff('+ 3 days'), '08:30', 45, 'bilan', 'scheduled', 'Bilan sanguin complet']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a8', 'p5', dateOff('+ 5 days'), '13:00', 30, 'consultation', 'scheduled', 'Résultats examens']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a9', 'p2', dateOff('+ 7 days'), '10:00', 45, 'echographie', 'scheduled', 'Échocardiographie de contrôle']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a10', 'p4', dateOff('+ 10 days'), '14:30', 30, 'suivi', 'scheduled', 'Suivi traitement tachycardie']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a11', 'p5', dateOff('- 1 day'), '11:00', 30, 'consultation', 'complete', 'Consultation initiale']
        );
        await query(
            `INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['a12', 'p1', dateOff('- 3 days'), '09:30', 30, 'suivi', 'complete', 'Contrôle de routine']
        );

        await query(
            `INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            ['rx1', 'p1', 'Gérard Bouchard', dateOff('today'), 'Dr. Étienne Tremblay',
             '[{"name":"Apo-Amlodipine","dosage":"5mg","frequency":"1 comprimé die","duration":"6 mois"},{"name":"Ramipril","dosage":"10mg","frequency":"1 comprimé die","duration":"6 mois"}]',
             'Traitement antihypertenseur. Prendre le matin.']
        );
        await query(
            `INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            ['rx2', 'p2', 'Sylvie Roy', dateOff('today'), 'Dr. Étienne Tremblay',
             '[{"name":"Eliquis","dosage":"5mg","frequency":"1 comprimé BID","duration":"6 mois"},{"name":"Bisoprolol","dosage":"2.5mg","frequency":"1 comprimé die","duration":"6 mois"}]',
             'Anticoagulation pour FA paroxystique. Surveillance INR.']
        );
        await query(
            `INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            ['rx3', 'p3', 'Michel Leblanc', dateOff('today'), 'Dr. Étienne Tremblay',
             '[{"name":"AAS","dosage":"80mg","frequency":"1 comprimé die","duration":"à vie"},{"name":"Plavix","dosage":"75mg","frequency":"1 comprimé die","duration":"12 mois"},{"name":"Atorvastatine","dosage":"40mg","frequency":"1 comprimé le soir","duration":"à vie"}]',
             'Post-IDM. Bithérapie antiplaquettaire. Contrôle lipidique.']
        );
        await query(
            `INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            ['rx4', 'p6', 'Robert Ouellet', dateOff('today'), 'Dr. Étienne Tremblay',
             '[{"name":"Lasix","dosage":"40mg","frequency":"1 comprimé die","duration":"à vie"},{"name":"Enalapril","dosage":"5mg","frequency":"1 comprimé BID","duration":"à vie"},{"name":"Aldactone","dosage":"25mg","frequency":"1 comprimé die","duration":"à vie"}]',
             'Insuffisance cardiaque. Surveillance poids et diurèse.']
        );
        await query(
            `INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            ['rx5', 'p7', 'Nathalie Pelletier', dateOff('today'), 'Dr. Étienne Tremblay',
             '[{"name":"Metformine","dosage":"500mg","frequency":"1 comprimé BID","duration":"à vie"},{"name":"Zestril","dosage":"10mg","frequency":"1 comprimé die","duration":"à vie"}]',
             'Diabète type 2 + HTA. Régime hyposodé conseillé.']
        );

        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_1', 'p1', 'ECG - Gérard Bouchard', 'analyse', '1.2 KB', 'uploads/ecg-gerard-bouchard.txt']
        );
        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_2', 'p1', 'Bilan sanguin - Gérard Bouchard', 'analyse', '0.8 KB', 'uploads/bilan-gerard-bouchard.txt']
        );
        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_3', 'p2', 'Holter 24h - Sylvie Roy', 'analyse', '1.5 KB', 'uploads/holter-sylvie-roy.txt']
        );
        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_4', 'p3', 'Échocardiographie - Michel Leblanc', 'echographie', '2.1 KB', 'uploads/echo-michel-leblanc.txt']
        );
        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_5', 'p4', 'ECG effort - Caroline Côté', 'analyse', '1.0 KB', 'uploads/ecg-effort-caroline-cote.txt']
        );
        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_6', 'p6', 'Radiographie pulmonaire - Robert Ouellet', 'radio', '1.8 KB', 'uploads/radio-robert-ouellet.txt']
        );
        await query(
            `INSERT INTO documents (id, patient_id, name, category, size, file_path)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['doc_7', 'p7', 'Bilan glycémique - Nathalie Pelletier', 'analyse', '0.6 KB', 'uploads/bilan-nathalie-pelletier.txt']
        );

        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m1', 'staff', 'admin', '1', null, "Bonjour, je suis disponible pour les consultations aujourd'hui.", ago('2 days'), true]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m2', 'staff', 'secretaire', '2', null, "Bonjour Dr. Tremblay. Monsieur Leblanc est arrivé pour son rendez-vous.", ago('1 day'), true]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m3', 'staff', 'admin', '1', null, "Merci. Je le reçois dans 5 minutes. J'ai besoin des résultats de sa prise de sang.", ago('1 day'), true]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m4', 'staff', 'secretaire', '2', null, "Les voici sur votre bureau. Avez-vous besoin d'autre chose ?", ago('20 hours'), true]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m5', 'staff', 'admin', '1', null, "Non merci. Je vous confirme la consultation pour Mme Pelletier à 11h demain.", ago('18 hours'), false]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m6', 'patient', 'patient', 'p1', 'p1', "Bonjour Docteur, j'aimerais savoir si je peux reprendre mes promenades quotidiennes.", ago('1 day'), true]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m7', 'patient', 'admin', '1', 'p1', "Bonjour M. Bouchard. Oui, la marche à rythme modéré est encouragée. Évitez les efforts intenses.", ago('20 hours'), true]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m8', 'patient', 'patient', 'p2', 'p2', "Mon pouls était à 100 battements par minute ce matin. Dois-je m'inquiéter ?", ago('5 hours'), false]
        );
        await query(
            `INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING`,
            ['m9', 'patient', 'patient', 'p3', 'p3', "Docteur, j'ai ressenti une douleur à la poitrine ce matin en montant les escaliers.", ago('3 hours'), false]
        );

        await query(
            `INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['ar_1', 'p3',
             '["doc_4"]',
             '{"summary":"Échocardiographie post-IDM: FEVG à 40%, akinésie antéro-septale. Amélioration partielle par rapport au précédent contrôle.","conclusions":"Risque résiduel modéré. Poursuivre traitement optimal. Contrôle dans 3 mois.","grade":"B"}',
             '1', ago('1 week')]
        );
        await query(
            `INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            ['ar_2', 'p1',
             '["doc_1","doc_2"]',
             '{"summary":"ECG: rythme sinusal régulier, pas d\'anomalie de repolarisation. Bilan: cholestérol LDL à 2.8 mmol/L, HbA1c 5.9%.","conclusions":"Bonne maîtrise des facteurs de risque. Poursuivre statines.","grade":"A"}',
             '1', ago('2 weeks')]
        );

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
