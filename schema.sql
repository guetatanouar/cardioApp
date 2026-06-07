-- CardioManager Database Schema + Seed Data
-- Run: psql -U postgres -d postgres -f schema.sql

-- ============================================================
-- SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'secretaire', 'patient')),
    full_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    address TEXT,
    rpps TEXT,
    specialty TEXT,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    initials TEXT
);

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    gender TEXT DEFAULT 'M',
    blood_type TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    country TEXT,
    emergency_contact TEXT,
    allergies TEXT,
    medical_history TEXT,
    pathology TEXT,
    severity_status TEXT NOT NULL DEFAULT 'stable' CHECK (severity_status IN ('critique', 'surveillance', 'stable')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vital_entries (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    systolic INTEGER,
    diastolic INTEGER,
    heart_rate INTEGER,
    sp02 INTEGER,
    weight NUMERIC(5,1),
    note TEXT
);

CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES users(id),
    date TEXT NOT NULL,
    motif TEXT NOT NULL,
    ecole TEXT,
    examen TEXT,
    diagnostic TEXT,
    traitement TEXT,
    note TEXT,
    author TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('analyse', 'radio', 'echographie', 'autre')),
    size TEXT,
    file_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    date DATE NOT NULL,
    doctor_name TEXT NOT NULL,
    medications JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    channel TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    patient_id TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    actor_name TEXT,
    actor_role TEXT NOT NULL,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    related_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_reports (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_ids JSONB NOT NULL DEFAULT '[]',
    report_content JSONB NOT NULL DEFAULT '{}',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS secretaire_permissions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_view_patients BOOLEAN NOT NULL DEFAULT false,
    can_edit_patients BOOLEAN NOT NULL DEFAULT false,
    can_delete_patients BOOLEAN NOT NULL DEFAULT false,
    can_view_appointments BOOLEAN NOT NULL DEFAULT false,
    can_edit_appointments BOOLEAN NOT NULL DEFAULT false,
    can_delete_appointments BOOLEAN NOT NULL DEFAULT false,
    can_view_chat BOOLEAN NOT NULL DEFAULT false,
    can_send_chat BOOLEAN NOT NULL DEFAULT false,
    can_view_prescriptions BOOLEAN NOT NULL DEFAULT false,
    can_edit_prescriptions BOOLEAN NOT NULL DEFAULT false,
    can_view_vitals BOOLEAN NOT NULL DEFAULT false,
    can_edit_vitals BOOLEAN NOT NULL DEFAULT false,
    can_view_documents BOOLEAN NOT NULL DEFAULT false,
    can_upload_documents BOOLEAN NOT NULL DEFAULT false,
    can_view_consultations BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS patient_accounts (
    id SERIAL PRIMARY KEY,
    patient_id TEXT UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. USERS (Staff)
-- Passwords are 'admin123' (bcrypt hashed)
INSERT INTO users (id, email, username, password_hash, role, full_name, first_name, last_name, initials, title, specialty) VALUES
('1', 'p.moreau@cardio.fr', 'pmoreau', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'admin', 'Dr. Pierre Moreau', 'Pierre', 'Moreau', 'PM', 'Dr.', 'Cardiologie'),
('2', 's.dubois@cardio.fr', 'sdubois', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'secretaire', 'Sophie Dubois', 'Sophie', 'Dubois', 'SD', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. PATIENTS
INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status) VALUES
('Pmq43ksu7nwkz', 'Jean', 'Dupont', '1955-03-12', 'M', 'A+', '0612345678', 'j.dupont@email.fr', '12 Rue de la Paix, 75002 Paris', 'France', 'Mme Dupont - 0612345679', 'Pénicilline', 'Hypertension depuis 2010', 'Insuffisance cardiaque légère', 'stable'),
('p2', 'Marie', 'Lefebvre', '1962-07-25', 'F', 'O-', '0623456789', 'm.lefebvre@email.fr', '45 Avenue des Champs-Élysées, 75008 Paris', 'France', 'M. Lefebvre - 0623456790', 'Aucune', 'Diabète de type 2', 'Arythmie', 'stable'),
('p3', 'Robert', 'Martin', '1948-11-30', 'M', 'B+', '0634567890', 'r.martin@email.fr', '8 Rue de la République, 69002 Lyon', 'France', 'Mme Martin - 0634567891', 'Iode', 'Triple pontage en 2015', 'Post-infarctus', 'critique'),
('p4', 'Camille', 'Bernard', '1975-01-15', 'F', 'AB+', '0645678901', 'c.bernard@email.fr', '22 Rue de la Liberté, 06000 Nice', 'France', 'M. Bernard - 0645678902', 'Aucune', 'Asthme', 'Tachycardie', 'surveillance'),
('p5', 'Lucas', 'Petit', '1988-05-20', 'M', 'A-', '0656789012', 'l.petit@email.fr', '15 Boulevard Victor Hugo, 31000 Toulouse', 'France', 'Mme Petit - 0656789013', 'Pollens', 'Aucun', 'Palpitations', 'stable'),
('p6', 'Ahmed', 'Benali', '1975-03-15', 'M', 'A+', '+213550123456', 'ahmed@email.com', 'Alger Centre, Algérie', 'Algérie', 'Fatima Benali - +213550999999', 'Pollen', 'Hypertension depuis 2010', 'Hypertension', 'critique'),
('p7', 'Fatima', 'Zohra', '1982-07-22', 'F', 'B+', '+213550789012', NULL, 'Oran, Algérie', 'Algérie', NULL, 'Aucune', 'Diabète de type 2', 'Diabète', 'stable'),
('p8', 'Karim', 'Saidi', '1968-11-05', 'M', 'O+', '+213550345678', 'karim@email.com', 'Sétif, Algérie', 'Algérie', 'Nadia Saidi - +213550345679', 'Sulfamides', 'Insuffisance cardiaque diagnostiquée en 2020', 'Insuffisance cardiaque', 'surveillance')
ON CONFLICT (id) DO NOTHING;

-- 3. VITAL ENTRIES
INSERT INTO vital_entries (id, patient_id, systolic, diastolic, heart_rate, sp02, weight, recorded_at) VALUES
('v1', 'Pmq43ksu7nwkz', 135, 85, 72, 98, 82.5, NOW() - INTERVAL '1 day'),
('v2', 'p2', 128, 80, 68, 97, 65.0, NOW() - INTERVAL '2 days'),
('v3', 'p3', 155, 95, 88, 94, 90.2, NOW() - INTERVAL '5 hours'),
('v4', 'p4', 120, 75, 75, 99, 58.0, NOW() - INTERVAL '3 days'),
('v5', 'p5', 118, 70, 65, 98, 75.0, NOW() - INTERVAL '12 hours'),
('v6', 'p6', 142, 92, 78, 96, 85.0, NOW() - INTERVAL '1 day'),
('v7', 'p7', 130, 82, 70, 98, 72.0, NOW() - INTERVAL '3 days'),
('v8', 'p8', 125, 78, 72, 97, 68.5, NOW() - INTERVAL '2 days');

-- 4. DOCUMENTS (for Analyse module)
INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES
('doc_1', 'Pmq43ksu7nwkz', 'ECG - Jean Dupont', 'analyse', '1.2 KB', 'uploads/ecg-jean-dupont.txt'),
('doc_2', 'Pmq43ksu7nwkz', 'Bilan sanguin - Jean Dupont', 'analyse', '0.8 KB', 'uploads/bilan-sanguin-jean-dupont.txt'),
('doc_3', 'p2', 'Échocardiographie - Claire Martin', 'echographie', '1.0 KB', 'uploads/echocardio-claire-martin.txt'),
('doc_4', 'p2', 'Holter 24h - Claire Martin', 'analyse', '0.9 KB', 'uploads/holter-claire-martin.txt')
ON CONFLICT (id) DO NOTHING;

-- 4. CONSULTATIONS
INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author, created_at) VALUES
('c1', 'Pmq43ksu7nwkz', '1', '2024-01-15', 'Suivi trimestriel', 'ECG normal, tension légèrement haute', 'Hypertension contrôlée', 'Continuer le traitement actuel', 'Patient essoufflé à l''effort', 'Dr. Pierre Moreau', NOW() - INTERVAL '1 month'),
('c2', 'p2', '1', '2024-01-20', 'Palpitations nocturnes', 'Pose d''un Holter', 'Suspicion de fibrillation auriculaire', 'Aspirine 100mg', 'Revoir après résultats Holter', 'Dr. Pierre Moreau', NOW() - INTERVAL '2 weeks'),
('c3', 'p3', '1', '2024-02-01', 'Douleur thoracique', 'ECG montre des signes d''ischémie', 'Angine de poitrine instable', 'Hospitalisation immédiate', 'Cas critique', 'Dr. Pierre Moreau', NOW() - INTERVAL '1 day'),
('c4', 'p6', '1', '2024-01-25', 'Contrôle hypertension', 'Prise de tension et ECG', 'HTA non contrôlée', 'Ajustement traitement: Amlodipine 10mg', 'À revoir dans 2 semaines', 'Dr. Pierre Moreau', NOW() - INTERVAL '1 week'),
('c5', 'p8', '1', '2024-01-28', 'Suivi insuffisance cardiaque', 'Échocardiographie', 'Insuffisance cardiaque stable', 'Maintien du traitement', 'Patient coopérant', 'Dr. Pierre Moreau', NOW() - INTERVAL '3 days');

-- 5. PRESCRIPTIONS
INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes) VALUES
('rx1', 'Pmq43ksu7nwkz', 'Jean Dupont', CURRENT_DATE, 'Dr. Pierre Moreau', '[{"name":"Amlodipine","dosage":"5mg","frequency":"1 comprimé le matin","duration":"6 mois"},{"name":"Ramipril","dosage":"10mg","frequency":"1 comprimé le soir","duration":"6 mois"}]', 'Traitement antihypertenseur'),
('rx2', 'p2', 'Marie Lefebvre', CURRENT_DATE, 'Dr. Pierre Moreau', '[{"name":"Kardegic","dosage":"75mg","frequency":"1 sachet par jour","duration":"3 mois"},{"name":"Bisoprolol","dosage":"2.5mg","frequency":"1 comprimé le matin","duration":"3 mois"}]', 'Prévention cardiovasculaire'),
('rx3', 'p6', 'Ahmed Benali', CURRENT_DATE, 'Dr. Pierre Moreau', '[{"name":"Amlodipine","dosage":"10mg","frequency":"1 comprimé le matin","duration":"3 mois"},{"name":"Lisinopril","dosage":"20mg","frequency":"1 comprimé le soir","duration":"3 mois"}]', 'Traitement HTA');

-- 6. APPOINTMENTS
INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason, notes) VALUES
('a1', 'Pmq43ksu7nwkz', CURRENT_DATE + INTERVAL '2 days', '09:00', 30, 'suivi', 'scheduled', 'Contrôle tension', NULL),
('a2', 'p2', CURRENT_DATE + INTERVAL '5 days', '10:30', 45, 'echographie', 'scheduled', 'Écho-doppler cardiaque', NULL),
('a3', 'p4', CURRENT_DATE + INTERVAL '1 day', '14:00', 20, 'consultation', 'scheduled', 'Premier RDV', NULL),
('a4', 'p3', CURRENT_DATE - INTERVAL '2 hours', '08:00', 60, 'urgence', 'completed', 'Douleur thoracique aiguë', NULL),
('a5', 'p6', CURRENT_DATE + INTERVAL '3 days', '11:00', 30, 'consultation', 'scheduled', 'Suivi hypertension', NULL),
('a6', 'p8', CURRENT_DATE + INTERVAL '7 days', '15:30', 45, 'suivi', 'scheduled', 'Échocardiographie de contrôle', NULL);

-- 7. CHAT MESSAGES
INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, created_at) VALUES
('m1', 'staff', 'admin', '1', NULL, 'Bonjour à tous', NOW() - INTERVAL '2 days'),
('m2', 'staff', 'secretaire', '2', NULL, 'Le Dr. Moreau est en consultation', NOW() - INTERVAL '1 day'),
('m3', 'patient', 'patient', 'Pmq43ksu7nwkz', 'Pmq43ksu7nwkz', 'Bonjour Docteur, j''ai oublié de vous demander si je peux continuer le sport.', NOW() - INTERVAL '1 day'),
('m4', 'patient', 'admin', '1', 'Pmq43ksu7nwkz', 'Bonjour M. Dupont. Oui, la marche rapide est recommandée, mais évitez les efforts violents.', NOW() - INTERVAL '20 hours'),
('m5', 'patient', 'patient', 'p2', 'p2', 'Ma tension est à 14/9 ce matin, est-ce normal ?', NOW() - INTERVAL '5 hours'),
('m6', 'patient', 'admin', '1', 'p2', 'C''est un peu haut. Reprenez-la dans 30 minutes au repos.', NOW() - INTERVAL '4 hours');

-- 8. SECRETAIRE PERMISSIONS
INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_view_appointments, can_edit_appointments, can_view_chat, can_send_chat, can_view_prescriptions, can_edit_prescriptions, can_view_vitals, can_edit_vitals, can_view_documents, can_upload_documents, can_view_consultations)
VALUES ('2', true, true, true, true, true, true, true, false, true, true, true, true, true)
ON CONFLICT (user_id) DO NOTHING;

-- 9. PATIENT ACCOUNTS (for patient portal login, password: patient123)
INSERT INTO patient_accounts (patient_id, username, password_hash, is_active)
SELECT id, LOWER(first_name || '.' || last_name), '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', true
FROM patients
ON CONFLICT (patient_id) DO NOTHING;
