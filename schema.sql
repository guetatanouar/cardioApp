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
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    blood_type TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    allergies TEXT,
    medical_history TEXT,
    pathology TEXT,
    severity_status TEXT NOT NULL DEFAULT 'stable' CHECK (severity_status IN ('critique', 'surveillance', 'stable'))
);

CREATE TABLE IF NOT EXISTS vital_entries (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate INTEGER,
    spo2 INTEGER,
    weight_kg NUMERIC(5,1),
    note TEXT
);

CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    exam TEXT,
    diagnosis TEXT,
    treatment TEXT,
    note TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category TEXT,
    file_name TEXT,
    file_url TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planifie' CHECK (status IN ('planifie', 'complete', 'annule', 'urgent')),
    reason TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    general_notes TEXT,
    items JSONB
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    channel TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    patient_id TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS secretaire_permissions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_view_patients BOOLEAN NOT NULL DEFAULT false,
    can_edit_patients BOOLEAN NOT NULL DEFAULT false,
    can_view_appointments BOOLEAN NOT NULL DEFAULT false,
    can_edit_appointments BOOLEAN NOT NULL DEFAULT false,
    can_view_chat BOOLEAN NOT NULL DEFAULT false,
    can_view_prescriptions BOOLEAN NOT NULL DEFAULT false,
    can_edit_prescriptions BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ
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
INSERT INTO users (id, email, username, password_hash, role, full_name) VALUES
('u1', 'p.moreau@cardio.fr', 'pmoreau', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'admin', 'Dr. Pierre Moreau'),
('u2', 's.dubois@cardio.fr', 'sdubois', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'secretaire', 'Sophie Dubois')
ON CONFLICT (id) DO NOTHING;

-- 2. PATIENTS
INSERT INTO patients (id, first_name, last_name, date_of_birth, blood_type, phone, email, address, emergency_contact_name, emergency_contact_phone, allergies, medical_history, pathology, severity_status) VALUES
('p1', 'Jean', 'Dupont', '1955-03-12', 'A+', '0612345678', 'j.dupont@email.fr', '12 Rue de la Paix, 75002 Paris', 'Mme Dupont', '0612345679', 'Pénicilline', 'Hypertension depuis 2010', 'Insuffisance cardiaque légère', 'stable'),
('p2', 'Marie', 'Lefebvre', '1962-07-25', 'O-', '0623456789', 'm.lefebvre@email.fr', '45 Avenue des Champs-Élysées, 75008 Paris', 'M. Lefebvre', '0623456790', 'Aucune', 'Diabète de type 2', 'Arythmie', 'stable'),
('p3', 'Robert', 'Martin', '1948-11-30', 'B+', '0634567890', 'r.martin@email.fr', '8 Rue de la République, 69002 Lyon', 'Mme Martin', '0634567891', 'Iode', 'Triple pontage en 2015', 'Post-infarctus', 'critique'),
('p4', 'Camille', 'Bernard', '1975-01-15', 'AB+', '0645678901', 'c.bernard@email.fr', '22 Rue de la Liberté, 06000 Nice', 'M. Bernard', '0645678902', 'Aucune', 'Asthme', 'Tachycardie', 'surveillance'),
('p5', 'Lucas', 'Petit', '1988-05-20', 'A-', '0656789012', 'l.petit@email.fr', '15 Boulevard Victor Hugo, 31000 Toulouse', 'Mme Petit', '0656789013', 'Pollens', 'Aucun', 'Palpitations', 'stable'),
('p6', 'Ahmed', 'Benali', '1975-03-15', 'A+', '+213550123456', 'ahmed@email.com', 'Alger Centre, Algérie', 'Fatima Benali', '+213550999999', 'Pollen', 'Hypertension depuis 2010', 'Hypertension', 'critique'),
('p7', 'Fatima', 'Zohra', '1982-07-22', 'B+', '+213550789012', NULL, 'Oran, Algérie', NULL, NULL, 'Aucune', 'Diabète de type 2', 'Diabète', 'stable'),
('p8', 'Karim', 'Saidi', '1968-11-05', 'O+', '+213550345678', 'karim@email.com', 'Sétif, Algérie', 'Nadia Saidi', '+213550345679', 'Sulfamides', 'Insuffisance cardiaque diagnostiquée en 2020', 'Insuffisance cardiaque', 'surveillance')
ON CONFLICT (id) DO NOTHING;

-- 3. VITAL ENTRIES
INSERT INTO vital_entries (patient_id, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, recorded_at) VALUES
('p1', 135, 85, 72, 98, 82.5, NOW() - INTERVAL '1 day'),
('p2', 128, 80, 68, 97, 65.0, NOW() - INTERVAL '2 days'),
('p3', 155, 95, 88, 94, 90.2, NOW() - INTERVAL '5 hours'),
('p4', 120, 75, 75, 99, 58.0, NOW() - INTERVAL '3 days'),
('p5', 118, 70, 65, 98, 75.0, NOW() - INTERVAL '12 hours'),
('p6', 142, 92, 78, 96, 85.0, NOW() - INTERVAL '1 day'),
('p7', 130, 82, 70, 98, 72.0, NOW() - INTERVAL '3 days'),
('p8', 125, 78, 72, 97, 68.5, NOW() - INTERVAL '2 days');

-- 4. CONSULTATIONS
INSERT INTO consultations (patient_id, doctor_id, reason, exam, diagnosis, treatment, note, created_at) VALUES
('p1', 'u1', 'Suivi trimestriel', 'ECG normal, tension légèrement haute', 'Hypertension contrôlée', 'Continuer le traitement actuel', 'Patient essoufflé à l''effort', NOW() - INTERVAL '1 month'),
('p2', 'u1', 'Palpitations nocturnes', 'Pose d''un Holter', 'Suspicion de fibrillation auriculaire', 'Aspirine 100mg', 'Revoir après résultats Holter', NOW() - INTERVAL '2 weeks'),
('p3', 'u1', 'Douleur thoracique', 'ECG montre des signes d''ischémie', 'Angine de poitrine instable', 'Hospitalisation immédiate', 'Cas critique', NOW() - INTERVAL '1 day'),
('p6', 'u1', 'Contrôle hypertension', 'Prise de tension et ECG', 'HTA non contrôlée', 'Ajustement traitement: Amlodipine 10mg', 'À revoir dans 2 semaines', NOW() - INTERVAL '1 week'),
('p8', 'u1', 'Suivi insuffisance cardiaque', 'Échocardiographie', 'Insuffisance cardiaque stable', 'Maintien du traitement', 'Patient coopérant', NOW() - INTERVAL '3 days');

-- 5. PRESCRIPTIONS
INSERT INTO prescriptions (patient_id, doctor_id, general_notes, items, created_at, expires_at) VALUES
('p1', 'u1', 'Traitement antihypertenseur', '[{"name":"Amlodipine","dosage":"5mg","frequency":"1 comprimé le matin","duration":"6 mois"},{"name":"Ramipril","dosage":"10mg","frequency":"1 comprimé le soir","duration":"6 mois"}]', NOW(), NOW() + INTERVAL '6 months'),
('p2', 'u1', 'Prévention cardiovasculaire', '[{"name":"Kardegic","dosage":"75mg","frequency":"1 sachet par jour","duration":"3 mois"},{"name":"Bisoprolol","dosage":"2.5mg","frequency":"1 comprimé le matin","duration":"3 mois"}]', NOW(), NOW() + INTERVAL '3 months'),
('p6', 'u1', 'Traitement HTA', '[{"name":"Amlodipine","dosage":"10mg","frequency":"1 comprimé le matin","duration":"3 mois"},{"name":"Lisinopril","dosage":"20mg","frequency":"1 comprimé le soir","duration":"3 mois"}]', NOW(), NOW() + INTERVAL '3 months');

-- 6. APPOINTMENTS
INSERT INTO appointments (patient_id, starts_at, duration_minutes, type, status, reason) VALUES
('p1', NOW() + INTERVAL '2 days', 30, 'suivi', 'planifie', 'Contrôle tension'),
('p2', NOW() + INTERVAL '5 days', 45, 'echographie', 'planifie', 'Écho-doppler cardiaque'),
('p4', NOW() + INTERVAL '1 day', 20, 'consultation', 'planifie', 'Premier RDV'),
('p3', NOW() - INTERVAL '2 hours', 60, 'urgence', 'complete', 'Douleur thoracique aiguë'),
('p6', NOW() + INTERVAL '3 days', 30, 'consultation', 'planifie', 'Suivi hypertension'),
('p8', NOW() + INTERVAL '7 days', 45, 'suivi', 'planifie', 'Échocardiographie de contrôle');

-- 7. CHAT MESSAGES
INSERT INTO chat_messages (channel, sender_role, sender_id, content, created_at) VALUES
('patient:p1', 'patient', 'p1', 'Bonjour Docteur, j''ai oublié de vous demander si je peux continuer le sport.', NOW() - INTERVAL '1 day'),
('patient:p1', 'admin', 'u1', 'Bonjour M. Dupont. Oui, la marche rapide est recommandée, mais évitez les efforts violents.', NOW() - INTERVAL '20 hours'),
('patient:p2', 'patient', 'p2', 'Ma tension est à 14/9 ce matin, est-ce normal ?', NOW() - INTERVAL '5 hours'),
('patient:p2', 'admin', 'u1', 'C''est un peu haut. Reprenez-la dans 30 minutes au repos.', NOW() - INTERVAL '4 hours');

-- 8. SECRETAIRE PERMISSIONS
INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_view_appointments, can_edit_appointments, can_view_chat, can_view_prescriptions, can_edit_prescriptions)
VALUES ('u2', true, true, true, true, true, true, false);

-- 9. PATIENT ACCOUNTS (for patient portal login, password: patient123)
INSERT INTO patient_accounts (patient_id, username, password_hash, is_active)
SELECT id, LOWER(first_name || '.' || last_name), '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', true
FROM patients;
