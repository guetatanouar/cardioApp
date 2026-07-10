import bcrypt from 'bcryptjs';
import { query } from './pool.js';
function ago(interval) {
    const m = interval.match(/(\d+)\s+(\w+)/);
    if (!m)
        return new Date().toISOString();
    const n = parseInt(m[1]);
    const ms = { hour: 3600000, hours: 3600000, day: 86400000, days: 86400000, week: 604800000, weeks: 604800000 };
    return new Date(Date.now() - n * (ms[m[2]] || 0)).toISOString();
}
function dateOff(expr) {
    const d = new Date();
    if (expr === 'today')
        return d.toISOString().split('T')[0];
    const m = expr.match(/([+-])\s*(\d+)\s+(\w+)/);
    if (!m)
        return d.toISOString().split('T')[0];
    const sign = m[1] === '-' ? -1 : 1;
    const n = parseInt(m[2]) * sign;
    const ms = { hour: 3600000, hours: 3600000, day: 86400000, days: 86400000, week: 604800000, weeks: 604800000 };
    return new Date(d.getTime() + n * (ms[m[3]] || 0)).toISOString().split('T')[0];
}
async function seed() {
    try {
        console.log('Starting seed...');
        await query('TRUNCATE TABLE analysis_reports, notifications, chat_messages, documents, prescriptions, appointments, consultations, vital_entries, patient_accounts, patients, secretaire_permissions, users RESTART IDENTITY CASCADE');
        const adminPass = await bcrypt.hash('admin123', 10);
        const secPass = await bcrypt.hash('sec123', 10);
        await query(`INSERT INTO users (id, username, email, password_hash, full_name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`, ['1', 'admin', 'e.tremblay@cardiologie-mtl.ca', adminPass, 'Dr. Étienne Tremblay', 'admin', 'ET', 'Cardiologue',
            '+1-514-555-1000', '4850 Boulevard de Maisonneuve O, Montréal, QC H3Z 1M1', '12345678901', 'Cardiologie',
            'Étienne', 'Tremblay']);
        await query(`INSERT INTO users (id, username, email, password_hash, full_name, role, initials, title, phone, address, rpps, specialty, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`, ['2', 'secretaire', 'mc.gagnon@cardiologie-mtl.ca', secPass, 'Marie-Claude Gagnon', 'secretaire', 'MCG', 'Secrétaire médicale',
            '+1-514-555-1001', '200 Rue Sainte-Catherine O, Montréal, QC H2X 3Y2', null, null, 'Marie-Claude', 'Gagnon']);
        // ── PATIENTS (9) ──────────────────────────────────────────────────────
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p1', 'Gérard', 'Bouchard', '1952-08-15', 'M', 'A+', '+1-514-555-0101', 'gerard.bouchard@email.ca',
            '4850 Boulevard de Maisonneuve O, Montréal, QC H3Z 1M1', 'Canada',
            'Mme Bouchard - +1-514-555-0102', 'Pénicilline', 'Hypertension artérielle diagnostiquée en 2010',
            'Hypertension', 'stable']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p2', 'Sylvie', 'Roy', '1960-04-22', 'F', 'O-', '+1-418-555-0202', 'sylvie.roy@email.ca',
            '125 Rue Saint-Jean, Québec, QC G1R 1P2', 'Canada',
            'M. Roy - +1-418-555-0203', 'Aucune', 'Fibrillation auriculaire paroxystique',
            'Arythmie', 'stable']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p3', 'Michel', 'Leblanc', '1945-11-30', 'M', 'B+', '+1-416-555-0303', 'michel.leblanc@email.ca',
            '350 King Street W, Toronto, ON M5V 3X9', 'Canada',
            'Mme Leblanc - +1-416-555-0304', 'Iode, Sulfamides', 'Pontage aortocoronarien en 2018, IDM antérieur en 2020',
            'Cardiopathie ischémique', 'critique']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p4', 'Caroline', 'Côté', '1978-02-14', 'F', 'AB+', '+1-604-555-0404', 'caroline.cote@email.ca',
            '850 West Hastings St, Vancouver, BC V6C 1E1', 'Canada',
            'M. Côté - +1-604-555-0405', 'Aucune', 'Asthme léger, anxiété',
            'Tachycardie sinusale', 'surveillance']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p5', 'Alexandre', 'Bergeron', '1985-07-09', 'M', 'A-', '+1-403-555-0505', 'alex.bergeron@email.ca',
            '150 9th Ave SW, Calgary, AB T2P 2S5', 'Canada',
            'Mme Bergeron - +1-403-555-0506', 'Pollens', 'Aucun antécédent cardiaque',
            'Palpitations', 'stable']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p6', 'Robert', 'Ouellet', '1940-03-18', 'M', 'O+', '+1-514-555-0606', 'robert.ouellet@email.ca',
            '1200 Rue Sherbrooke E, Montréal, QC H2L 1L6', 'Canada',
            'Mme Ouellet - +1-514-555-0607', 'AAS', 'Insuffisance cardiaque congestive, MPOC',
            'Insuffisance cardiaque', 'critique']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p7', 'Nathalie', 'Pelletier', '1972-09-25', 'F', 'B-', '+1-613-555-0707', 'nathalie.pelletier@email.ca',
            '200 Elgin Street, Ottawa, ON K2P 1L5', 'Canada',
            'M. Pelletier - +1-613-555-0708', 'Sulfamides', 'Diabète de type 2 depuis 2015, HTA',
            'Diabète type 2 + HTA', 'surveillance']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p8', 'James', 'MacDonald', '1968-12-03', 'M', 'A+', '+1-902-555-0808', 'james.macdonald@email.ca',
            '5675 Spring Garden Rd, Halifax, NS B3J 1H1', 'Canada',
            'Mrs MacDonald - +1-902-555-0809', 'Pénicilline, Latex', 'Hypercholestérolémie familiale, angioplastie en 2021',
            'Hypercholestérolémie', 'stable']);
        await query(`INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`, ['p9', 'Catherine', 'Lavoie', '1990-06-20', 'F', 'AB-', '+1-819-555-0909', 'catherine.lavoie@email.ca',
            '85 Rue Wellington Nord, Sherbrooke, QC J1H 5B9', 'Canada',
            'M. Lavoie - +1-819-555-0910', 'Arachides', 'Migraines, antécédent familial de cardiomyopathie',
            'Souffle cardiaque', 'surveillance']);
        // ── PATIENT ACCOUNTS (9) ──────────────────────────────────────────────
        const patientPasswords = {
            p1: 'gerard123', p2: 'sylvie123', p3: 'michel123',
            p4: 'caroline123', p5: 'alex123', p6: 'robert123',
            p7: 'nathalie123', p8: 'james123', p9: 'catherine123'
        };
        for (const [pid, pwd] of Object.entries(patientPasswords)) {
            const hash = await bcrypt.hash(pwd, 10);
            const names = {
                p1: 'gerard.bouchard', p2: 'sylvie.roy', p3: 'michel.leblanc',
                p4: 'caroline.cote', p5: 'alexandre.bergeron', p6: 'robert.ouellet',
                p7: 'nathalie.pelletier', p8: 'james.macdonald', p9: 'catherine.lavoie'
            };
            await query(`INSERT INTO patient_accounts (patient_id, username, password_hash)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (username) DO NOTHING`, [pid, names[pid], hash]);
        }
        // ── VITALS (at least 2 per patient) ───────────────────────────────────
        const vitals = [
            ['v1', 'p1', ago('1 day'), 135, 85, 72, 98, 78.5],
            ['v2', 'p1', ago('1 week'), 142, 88, 76, 97, 79.0],
            ['v3', 'p2', ago('2 days'), 128, 78, 68, 97, 62.5],
            ['v4', 'p2', ago('2 weeks'), 132, 80, 70, 98, 63.0],
            ['v5', 'p3', ago('5 hours'), 155, 95, 112, 91, 88.0],
            ['v6', 'p3', ago('3 days'), 148, 92, 108, 93, 87.5],
            ['v7', 'p4', ago('1 day'), 118, 72, 108, 98, 55.0],
            ['v8', 'p4', ago('1 week'), 122, 74, 105, 99, 55.5],
            ['v9', 'p5', ago('12 hours'), 120, 75, 65, 98, 72.0],
            ['v10', 'p5', ago('2 days'), 118, 72, 62, 99, 71.5],
            ['v11', 'p6', ago('4 hours'), 160, 100, 95, 88, 95.0],
            ['v12', 'p6', ago('1 week'), 155, 98, 92, 90, 94.5],
            ['v13', 'p7', ago('3 days'), 142, 88, 78, 96, 70.0],
            ['v14', 'p7', ago('5 days'), 138, 85, 75, 97, 69.5],
            ['v15', 'p8', ago('1 day'), 132, 82, 70, 97, 82.0],
            ['v16', 'p8', ago('10 days'), 128, 80, 68, 98, 81.5],
            ['v17', 'p9', ago('2 days'), 110, 65, 98, 99, 58.0],
            ['v18', 'p9', ago('1 week'), 108, 62, 95, 99, 57.5],
        ];
        for (const v of vitals) {
            await query(`INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (id) DO NOTHING`, v);
        }
        // ── CONSULTATIONS (at least 1 per patient) ────────────────────────────
        const consultations = [
            ['c1', 'p1', '1', '2025-06-02', 'Suivi trimestriel HTA',
                'ECG normal, TA 135/85, auscultation cardiaque normale',
                'Hypertension artérielle contrôlée', 'Maintien Amlodipine 5mg et Ramipril 10mg',
                'Patient asymptomatique. Bonne observance thérapeutique.', 'Dr. Étienne Tremblay'],
            ['c2', 'p2', '1', '2025-06-05', 'Palpitations nocturnes',
                'Holter 24h posé, ECG 12 dérivations normal',
                'Fibrillation auriculaire paroxystique', 'Apixaban 5mg BID, Bisoprolol 2.5mg die',
                'Revoir après résultats Holter. Anticoagulation débutée.', 'Dr. Étienne Tremblay'],
            ['c3', 'p3', '1', '2025-05-15', 'Douleur thoracique rétrosternale',
                'ECG avec sus-décalage ST en V3-V4, troponines élevées',
                'Infarctus du myocarde antérieur aigu', 'Angioplastie + stent, AAS 80mg, Clopidogrel 75mg, Atorvastatine 40mg',
                'Hospitalisation en soins intensifs. Évolution favorable.', 'Dr. Étienne Tremblay'],
            ['c4', 'p4', '1', '2025-06-10', 'Tachycardie et palpitations',
                'ECG montre tachycardie sinusale à 108/min, échocardiographie normale',
                'Tachycardie sinusale inappropriée', 'Bisoprolol 1.25mg die, avis cardiopédiatrique',
                'À surveiller. Éliminer cause thyroïdienne.', 'Dr. Étienne Tremblay'],
            ['c5', 'p5', '1', '2025-06-08', 'Palpitations depuis 3 mois',
                'Holter normal, ECG normal, échocardiographie normale',
                'Palpitations bénignes liées au stress', 'Aucun traitement. Techniques de relaxation conseillées.',
                'Patient jeune et sportif. Pas de cardiopathie sous-jacente.', 'Dr. Étienne Tremblay'],
            ['c6', 'p6', '1', '2025-06-12', 'Dyspnée d\'effort croissante',
                'Échocardiographie montre FEVG 35%, crépitants pulmonaires',
                'Insuffisance cardiaque congestive décompensée', 'Furosémide 40mg die, Enalapril 5mg die, Spironolactone 25mg die',
                'Patient âgé, surveillance rapprochée. Suivi diététique.', 'Dr. Étienne Tremblay'],
            ['c7', 'p7', '1', '2025-06-09', 'Suivi diabète et HTA',
                'TA 142/88, HbA1c 7.2%, ECG normal',
                'Diabète type 2 partiellement contrôlé. HTA légère.', 'Metformine 500mg BID, Lisinopril 10mg die, régime hyposodé',
                'Encourager activité physique modérée. Contrôle dans 3 mois.', 'Dr. Étienne Tremblay'],
            ['c8', 'p8', '1', '2025-06-03', 'Suivi cholestérol et bilan cardiaque',
                'ECG normal, échodoppler des carotides normal, LDL à 3.2 mmol/L',
                'Hypercholestérolémie familiale contrôlée', 'Rosuvastatine 20mg die, régime pauvre en graisses saturées',
                'Bilan satisfaisant. Contrôle annuel.', 'Dr. Étienne Tremblay'],
            ['c9', 'p9', '1', '2025-06-11', 'Souffle cardiaque détecté en consultation',
                'Échocardiographie: prolapsus mitral léger avec régurgitation minime',
                'Prolapsus valvulaire mitral asymptomatique', 'Aucun traitement. Prophylaxie de l\'endocardite bactérienne si nécessaire.',
                'Patient asymptomatique. Surveillance échographique annuelle.', 'Dr. Étienne Tremblay'],
        ];
        for (const c of consultations) {
            await query(`INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`, c);
        }
        // ── APPOINTMENTS (mix of past, today, future) ─────────────────────────
        const appointments = [
            ['a1', 'p1', dateOff('today'), '09:00', 30, 'suivi', 'scheduled', 'Contrôle tension artérielle'],
            ['a2', 'p2', dateOff('today'), '10:30', 45, 'echographie', 'scheduled', 'Écho-doppler cardiaque de contrôle'],
            ['a3', 'p6', dateOff('today'), '14:00', 60, 'urgence', 'urgent', 'Dyspnée aiguë - décompensation cardiaque'],
            ['a4', 'p4', dateOff('+ 1 day'), '09:00', 30, 'consultation', 'scheduled', 'Consultation tachycardie'],
            ['a5', 'p7', dateOff('+ 1 day'), '11:00', 30, 'suivi', 'scheduled', 'Suivi diabète et HTA'],
            ['a6', 'p3', dateOff('+ 1 day'), '15:30', 45, 'suivi', 'scheduled', 'Post-hospitalisation contrôle'],
            ['a7', 'p8', dateOff('+ 2 days'), '08:30', 30, 'consultation', 'scheduled', 'Bilan lipidique de contrôle'],
            ['a8', 'p9', dateOff('+ 2 days'), '10:00', 45, 'echographie', 'scheduled', 'Échocardiographie de contrôle'],
            ['a9', 'p1', dateOff('+ 4 days'), '08:30', 45, 'bilan', 'scheduled', 'Bilan sanguin complet'],
            ['a10', 'p5', dateOff('+ 5 days'), '13:00', 30, 'consultation', 'scheduled', 'Résultats examens'],
            ['a11', 'p2', dateOff('+ 7 days'), '10:00', 45, 'echographie', 'scheduled', 'Échocardiographie de contrôle'],
            ['a12', 'p4', dateOff('+ 10 days'), '14:30', 30, 'suivi', 'scheduled', 'Suivi traitement tachycardie'],
            ['a13', 'p5', dateOff('- 1 day'), '11:00', 30, 'consultation', 'complete', 'Consultation initiale'],
            ['a14', 'p1', dateOff('- 3 days'), '09:30', 30, 'suivi', 'complete', 'Contrôle de routine'],
            ['a15', 'p9', dateOff('- 7 days'), '14:00', 30, 'consultation', 'complete', 'Bilan souffle cardiaque'],
        ];
        for (const a of appointments) {
            await query(`INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (id) DO NOTHING`, a);
        }
        // ── PRESCRIPTIONS (at least 1 per patient) ────────────────────────────
        const prescriptions = [
            ['rx1', 'p1', 'Gérard Bouchard', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Apo-Amlodipine","dosage":"5mg","frequency":"1 comprimé die","duration":"6 mois"},{"name":"Ramipril","dosage":"10mg","frequency":"1 comprimé die","duration":"6 mois"}]'],
            ['rx2', 'p2', 'Sylvie Roy', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Eliquis","dosage":"5mg","frequency":"1 comprimé BID","duration":"6 mois"},{"name":"Bisoprolol","dosage":"2.5mg","frequency":"1 comprimé die","duration":"6 mois"}]'],
            ['rx3', 'p3', 'Michel Leblanc', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"AAS","dosage":"80mg","frequency":"1 comprimé die","duration":"à vie"},{"name":"Plavix","dosage":"75mg","frequency":"1 comprimé die","duration":"12 mois"},{"name":"Atorvastatine","dosage":"40mg","frequency":"1 comprimé le soir","duration":"à vie"}]'],
            ['rx4', 'p6', 'Robert Ouellet', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Lasix","dosage":"40mg","frequency":"1 comprimé die","duration":"à vie"},{"name":"Enalapril","dosage":"5mg","frequency":"1 comprimé BID","duration":"à vie"},{"name":"Aldactone","dosage":"25mg","frequency":"1 comprimé die","duration":"à vie"}]'],
            ['rx5', 'p7', 'Nathalie Pelletier', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Metformine","dosage":"500mg","frequency":"1 comprimé BID","duration":"à vie"},{"name":"Zestril","dosage":"10mg","frequency":"1 comprimé die","duration":"à vie"}]'],
            ['rx6', 'p4', 'Caroline Côté', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Bisoprolol","dosage":"1.25mg","frequency":"1 comprimé die","duration":"3 mois"}]'],
            ['rx7', 'p5', 'Alexandre Bergeron', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Magnésium","dosage":"300mg","frequency":"1 comprimé die","duration":"2 mois"}]'],
            ['rx8', 'p8', 'James MacDonald', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Crestor","dosage":"20mg","frequency":"1 comprimé le soir","duration":"à vie"},{"name":"AAS","dosage":"80mg","frequency":"1 comprimé die","duration":"à vie"}]'],
            ['rx9', 'p9', 'Catherine Lavoie', dateOff('today'), 'Dr. Étienne Tremblay',
                '[{"name":"Propranolol","dosage":"10mg","frequency":"1 comprimé die","duration":"3 mois"}]'],
        ];
        for (const rx of prescriptions) {
            await query(`INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`, [...rx]);
        }
        // ── DOCUMENTS (at least 1 per patient) ────────────────────────────────
        const docs = [
            ['doc_1', 'p1', 'ECG - Gérard Bouchard', 'analyse', '1.2 KB', 'uploads/ecg-gerard-bouchard.txt'],
            ['doc_2', 'p1', 'Bilan sanguin - Gérard Bouchard', 'analyse', '0.8 KB', 'uploads/bilan-gerard-bouchard.txt'],
            ['doc_3', 'p2', 'Holter 24h - Sylvie Roy', 'analyse', '1.5 KB', 'uploads/holter-sylvie-roy.txt'],
            ['doc_4', 'p3', 'Échocardiographie - Michel Leblanc', 'echographie', '2.1 KB', 'uploads/echo-michel-leblanc.txt'],
            ['doc_5', 'p4', 'ECG effort - Caroline Côté', 'analyse', '1.0 KB', 'uploads/ecg-effort-caroline-cote.txt'],
            ['doc_6', 'p6', 'Radiographie pulmonaire - Robert Ouellet', 'radio', '1.8 KB', 'uploads/radio-robert-ouellet.txt'],
            ['doc_7', 'p7', 'Bilan glycémique - Nathalie Pelletier', 'analyse', '0.6 KB', 'uploads/bilan-nathalie-pelletier.txt'],
            ['doc_8', 'p5', 'ECG - Alexandre Bergeron', 'analyse', '0.9 KB', 'uploads/ecg-alexandre-bergeron.txt'],
            ['doc_9', 'p8', 'Bilan lipidique - James MacDonald', 'analyse', '1.1 KB', 'uploads/bilan-james-macdonald.txt'],
            ['doc_10', 'p9', 'Échocardiographie - Catherine Lavoie', 'echographie', '2.3 KB', 'uploads/echo-catherine-lavoie.txt'],
        ];
        for (const d of docs) {
            await query(`INSERT INTO documents (id, patient_id, name, category, size, file_path)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`, d);
        }
        // ── CHAT MESSAGES ─────────────────────────────────────────────────────
        const chats = [
            ['m1', 'staff', 'admin', '1', '', "Bonjour, je suis disponible pour les consultations aujourd'hui.", ago('2 days'), true],
            ['m2', 'staff', 'secretaire', '2', '', "Bonjour Dr. Tremblay. Monsieur Leblanc est arrivé pour son rendez-vous.", ago('1 day'), true],
            ['m3', 'staff', 'admin', '1', '', "Merci. Je le reçois dans 5 minutes.", ago('1 day'), true],
            ['m4', 'staff', 'secretaire', '2', '', "Les voici sur votre bureau. Avez-vous besoin d'autre chose ?", ago('20 hours'), true],
            ['m5', 'staff', 'admin', '1', '', "Non merci. Je vous confirme la consultation pour Mme Pelletier à 11h demain.", ago('18 hours'), false],
            ['m6', 'patient', 'patient', 'p1', 'p1', "Bonjour Docteur, j'aimerais reprendre mes promenades quotidiennes.", ago('1 day'), true],
            ['m7', 'patient', 'admin', '1', 'p1', "Bonjour M. Bouchard. Oui, la marche modérée est encouragée.", ago('20 hours'), true],
            ['m8', 'patient', 'patient', 'p2', 'p2', "Mon pouls était à 100 BPM ce matin. Dois-je m'inquiéter ?", ago('5 hours'), false],
            ['m9', 'patient', 'patient', 'p3', 'p3', "Docteur, j'ai ressenti une douleur à la poitrine en montant les escaliers.", ago('3 hours'), false],
            ['m10', 'patient', 'patient', 'p6', 'p6', "J'ai pris 2 kg cette semaine, est-ce normal ?", ago('6 hours'), false],
            ['m11', 'patient', 'admin', '1', 'p6', "M. Ouellet, surveillez votre poids quotidiennement. Je vous reçoirai demain.", ago('5 hours'), false],
            ['m12', 'patient', 'patient', 'p8', 'p8', "Mon dernier LDL était à 3.2, est-ce satisfaisant docteur ?", ago('2 days'), true],
            ['m13', 'patient', 'admin', '1', 'p8', "Bonjour M. MacDonald. Continuez votre traitement et le régime. Rendez-vous dans 6 mois.", ago('1 day'), true],
        ];
        for (const msg of chats) {
            await query(`INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at, is_read)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (id) DO NOTHING`, msg);
        }
        // ── NOTIFICATIONS ─────────────────────────────────────────────────────
        const notifs = [
            { type: 'critical_alert', title: 'Alerte - Robert Ouellet', message: 'SpO2 à 88%, FC 95 bpm. Patient instable.', actor_name: 'Dr. Étienne Tremblay', actor_role: 'admin', patient_id: 'p6', is_read: false, created_at: ago('4 hours') },
            { type: 'vitals_added', title: 'Nouveaux signes vitaux - Robert Ouellet', message: 'TA 160/100, saturation 88%', actor_name: 'Infirmière', actor_role: 'secretaire', patient_id: 'p6', is_read: false, created_at: ago('4 hours') },
            { type: 'appointment_created', title: 'Rendez-vous urgent - Robert Ouellet', message: 'Dyspnée aiguë à 14h00', actor_name: 'Marie-Claude Gagnon', actor_role: 'secretaire', patient_id: 'p6', is_read: false, created_at: ago('2 hours') },
            { type: 'patient_created', title: 'Nouveau patient - James MacDonald', message: 'Hypercholestérolémie familiale', actor_name: 'Marie-Claude Gagnon', actor_role: 'secretaire', patient_id: 'p8', is_read: true, created_at: ago('3 days') },
            { type: 'patient_created', title: 'Nouveau patient - Catherine Lavoie', message: 'Souffle cardiaque à explorer', actor_name: 'Marie-Claude Gagnon', actor_role: 'secretaire', patient_id: 'p9', is_read: true, created_at: ago('5 days') },
            { type: 'consultation_added', title: 'Consultation - Catherine Lavoie', message: 'Prolapsus mitral diagnostiqué', actor_name: 'Dr. Étienne Tremblay', actor_role: 'admin', patient_id: 'p9', is_read: true, created_at: ago('4 days') },
            { type: 'vitals_added', title: 'Nouveaux signes vitaux - Michel Leblanc', message: 'TA 155/95, FC 112, saturation 91%', actor_name: 'Infirmière', actor_role: 'secretaire', patient_id: 'p3', is_read: false, created_at: ago('5 hours') },
            { type: 'prescription_created', title: 'Ordonnance créée - Nathalie Pelletier', message: 'Metformine + Zestril', actor_name: 'Dr. Étienne Tremblay', actor_role: 'admin', patient_id: 'p7', is_read: true, created_at: ago('1 day') },
            { type: 'chat_message', title: 'Nouveau message - Sylvie Roy', message: 'Mon pouls était à 100 BPM ce matin', actor_name: 'Sylvie Roy', actor_role: 'patient', patient_id: 'p2', is_read: false, created_at: ago('5 hours') },
            { type: 'chat_message', title: 'Nouveau message - Michel Leblanc', message: 'Douleur à la poitrine en montant les escaliers', actor_name: 'Michel Leblanc', actor_role: 'patient', patient_id: 'p3', is_read: false, created_at: ago('3 hours') },
        ];
        for (const n of notifs) {
            await query(`INSERT INTO notifications (type, title, message, actor_name, actor_role, patient_id, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [n.type, n.title, n.message, n.actor_name, n.actor_role, n.patient_id, n.is_read, n.created_at]);
        }
        // ── ANALYSIS REPORTS ──────────────────────────────────────────────────
        await query(`INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['ar_1', 'p3',
            '["doc_4"]',
            '{"summary":"Échocardiographie post-IDM: FEVG à 40%, akinésie antéro-septale. Amélioration partielle.","conclusions":"Risque résiduel modéré. Poursuivre traitement optimal. Contrôle dans 3 mois.","grade":"B"}',
            '1', ago('1 week')]);
        await query(`INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['ar_2', 'p1',
            '["doc_1","doc_2"]',
            '{"summary":"ECG: rythme sinusal régulier. Bilan: LDL 2.8 mmol/L, HbA1c 5.9%.","conclusions":"Bonne maîtrise des facteurs de risque. Poursuivre statines.","grade":"A"}',
            '1', ago('2 weeks')]);
        await query(`INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`, ['ar_3', 'p9',
            '["doc_10"]',
            '{"summary":"Échocardiographie: prolapsus valvulaire mitral léger avec régurgitation minime. Fonction VG normale.","conclusions":"Lésion bénigne. Surveillance annuelle. Prophylaxie endocardite if procédures invasives.","grade":"A"}',
            '1', ago('3 days')]);
        // ── SECRETAIRE PERMISSIONS ────────────────────────────────────────────
        const secUser = await query('SELECT id FROM users WHERE username = $1', ['secretaire']);
        if (secUser.rows.length > 0) {
            const secUserId = secUser.rows[0].id;
            await query(`INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_delete_patients,
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
        console.log('→ Login: admin / admin123 (Dr. Tremblay)');
        console.log('→ Login: secretaire / sec123 (Marie-Claude Gagnon)');
        console.log('→ Patient accounts available for all 9 patients');
        process.exit(0);
    }
    catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}
seed();
