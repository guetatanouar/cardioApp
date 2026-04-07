-- CardioManager Seed Data (French)

-- Cleanup
TRUNCATE appointments, prescriptions, chat_messages, vital_entries, consultations, documents, patient_accounts, patients, users CASCADE;

-- 1. USERS (Staff)
-- Passwords are 'admin123' (bcrypt hashed)
INSERT INTO users (id, username, email, password, name, role, initials, title) VALUES
(1, 'admin', 'p.moreau@cardio.fr', '$2b$10$qMNMGVTZqU5z5z5z5z5z5Oe', 'Dr. Pierre Moreau', 'admin', 'PM', 'Cardiologue'),
(2, 'secretaire', 's.dubois@cardio.fr', '$2b$10$qMNMGVTZqU5z5z5z5z5z5Oe', 'Sophie Dubois', 'secretaire', 'SD', 'Secrétaire médicale');

-- 2. PATIENTS
INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, allergies, medical_history, pathology, severity_status) VALUES
('p1', 'Jean', 'Dupont', '1955-03-12', 'M', '0612345678', 'j.dupont@email.fr', '12 Rue de la Paix, 75002 Paris', 'A+', ARRAY['Pénicilline'], ARRAY['Hypertension depuis 2010'], 'Insuffisance cardiaque légère', 'stable'),
('p2', 'Marie', 'Lefebvre', '1962-07-25', 'F', '0623456789', 'm.lefebvre@email.fr', '45 Avenue des Champs-Élysées, 75008 Paris', 'O-', ARRAY['Aucune'], ARRAY['Diabète de type 2'], 'Arythmie', 'stable'),
('p3', 'Robert', 'Martin', '1948-11-30', 'M', '0634567890', 'r.martin@email.fr', '8 Rue de la République, 69002 Lyon', 'B+', ARRAY['Iode'], ARRAY['Triple pontage en 2015'], 'Post-infarctus', 'critical'),
('p4', 'Camille', 'Bernard', '1975-01-15', 'F', '0645678901', 'c.bernard@email.fr', '22 Rue de la Liberté, 06000 Nice', 'AB+', ARRAY['Aucune'], ARRAY['Asthme'], 'Tachycardie', 'moderate'),
('p5', 'Lucas', 'Petit', '1988-05-20', 'M', '0656789012', 'l.petit@email.fr', '15 Boulevard Victor Hugo, 31000 Toulouse', 'A-', ARRAY['Pollens'], ARRAY['Aucun'], 'Palpitations', 'stable');

-- 3. VITAL_ENTRIES (Recent entries)
INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight, note) VALUES
('v1', 'p1', NOW() - INTERVAL '1 day', 135, 85, 72, 98, 82.5, NULL),
('v2', 'p2', NOW() - INTERVAL '2 days', 128, 80, 68, 97, 65.0, NULL),
('v3', 'p3', NOW() - INTERVAL '5 hours', 155, 95, 88, 94, 90.2, NULL),
('v4', 'p4', NOW() - INTERVAL '3 days', 120, 75, 75, 99, 58.0, NULL),
('v5', 'p5', NOW() - INTERVAL '12 hours', 118, 70, 65, 98, 75.0, NULL);

-- 4. PATIENT_ACCOUNTS
INSERT INTO patient_accounts (id, patient_id, username, password) VALUES
(1, 'p1', 'jdupont', '$2b$10$qMNMGVTZqU5z5z5z5z5z5Oe'),
(2, 'p2', 'mlefebvre', '$2b$10$qMNMGVTZqU5z5z5z5z5z5Oe'),
(3, 'p3', 'rmartin', '$2b$10$qMNMGVTZqU5z5z5z5z5z5Oe');

-- 5. CONSULTATIONS
INSERT INTO consultations (id, patient_id, date, motif, examen, diagnostic, traitement, note, author) VALUES
('c1', 'p1', '2024-03-15', 'Suivi trimestriel', 'ECG normal, tension légèrement haute', 'Hypertension contrôlée', 'Continuer le traitement actuel', 'Patient essoufflé à l''effort', 'Dr. Pierre Moreau'),
('c2', 'p2', '2024-04-01', 'Palpitations nocturnes', 'Pose d''un Holter', 'Suspicion de fibrillation auriculaire', 'Aspirine 100mg', 'Revoir après résultats Holter', 'Dr. Pierre Moreau'),
('c3', 'p3', NOW()::date::text, 'Douleur thoracique', 'ECG montre des signes d''ischémie', 'Angine de poitrine instable', 'Hospitalisation immédiate', 'Cas critique', 'Dr. Pierre Moreau');

-- 6. PRESCRIPTIONS
INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes) VALUES
('pr1', 'p1', 'Jean Dupont', NOW()::date, 'Dr. Pierre Moreau', 
 '[{"name": "Amlodipine 5mg", "dosage": "1 comprimé le matin"}, {"name": "Ramipril 10mg", "dosage": "1 comprimé le soir"}]',
 NULL),
('pr2', 'p2', 'Marie Lefebvre', NOW()::date, 'Dr. Pierre Moreau',
 '[{"name": "Kardegic 75mg", "dosage": "1 sachet par jour"}, {"name": "Bisoprolol 2.5mg", "dosage": "1 comprimé le matin"}]',
 NULL);

-- 7. APPOINTMENTS
INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason) VALUES
('a1', 'p1', (NOW() + INTERVAL '2 days')::date, '10:00', 30, 'suivi', 'scheduled', 'Contrôle tension'),
('a2', 'p2', (NOW() + INTERVAL '5 days')::date, '14:30', 45, 'echographie', 'scheduled', 'Écho-doppler cardiaque'),
('a3', 'p4', (NOW() + INTERVAL '1 day')::date, '09:00', 20, 'consultation', 'scheduled', 'Premier RDV'),
('a4', 'p3', NOW()::date, '16:00', 60, 'urgence', 'complete', 'Douleur thoracique aiguë');

-- 8. CHAT_MESSAGES
INSERT INTO chat_messages (id, channel, patient_id, from_name, from_role, text, is_read, created_at) VALUES
('m1', 'patient', 'p1', 'Jean Dupont', 'patient', 'Bonjour Docteur, j''ai oublié de vous demander si je peux continuer le sport.', false, NOW() - INTERVAL '1 day'),
('m2', 'staff', NULL, 'Dr. Pierre Moreau', 'admin', 'Bonjour M. Dupont. Oui, la marche rapide est recommandée, mais évitez les efforts violents.', true, NOW() - INTERVAL '20 hours'),
('m3', 'patient', 'p2', 'Marie Lefebvre', 'patient', 'Ma tension est à 14/9 ce matin, est-ce normal ?', false, NOW() - INTERVAL '5 hours'),
('m4', 'staff', NULL, 'Dr. Pierre Moreau', 'admin', 'C''est un peu haut. Reprenez-la dans 30 minutes au repos.', false, NOW() - INTERVAL '4 hours');
