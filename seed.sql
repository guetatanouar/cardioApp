-- CardioManager Seed Data (French)
-- Usage: psql -U your_user -d your_db -f seed.sql

-- Cleanup (Optional, be careful)
-- TRUNCATE appointments, prescriptions, messages, vitals, consultations, patients, users CASCADE;

-- 1. USERS (Staff)
-- Passwords are 'admin123' (hashed)
INSERT INTO users (id, email, password, role, full_name) VALUES
('u1', 'p.moreau@cardio.fr', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'admin', 'Dr. Pierre Moreau'),
('u2', 's.dubois@cardio.fr', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'secretaire', 'Sophie Dubois');

-- 2. PATIENTS
INSERT INTO patients (id, first_name, last_name, birth_date, gender, phone, email, address, blood_type, allergies, medical_history, pathology, severity) VALUES
('p1', 'Jean', 'Dupont', '1955-03-12', 'M', '0612345678', 'j.dupont@email.fr', '12 Rue de la Paix, 75002 Paris', 'A+', 'Pénicilline', 'Hypertension depuis 2010', 'Insuffisance cardiaque légère', 'stable'),
('p2', 'Marie', 'Lefebvre', '1962-07-25', 'F', '0623456789', 'm.lefebvre@email.fr', '45 Avenue des Champs-Élysées, 75008 Paris', 'O-', 'Aucune', 'Diabète de type 2', 'Arythmie', 'stable'),
('p3', 'Robert', 'Martin', '1948-11-30', 'M', '0634567890', 'r.martin@email.fr', '8 Rue de la République, 69002 Lyon', 'B+', 'Iode', 'Triple pontage en 2015', 'Post-infarctus', 'critical'),
('p4', 'Camille', 'Bernard', '1975-01-15', 'F', '0645678901', 'c.bernard@email.fr', '22 Rue de la Liberté, 06000 Nice', 'AB+', 'Aucune', 'Asthme', 'Tachycardie', 'moderate'),
('p5', 'Lucas', 'Petit', '1988-05-20', 'M', '0656789012', 'l.petit@email.fr', '15 Boulevard Victor Hugo, 31000 Toulouse', 'A-', 'Pollens', 'Aucun', 'Palpitations', 'stable');

-- 3. VITALS (Recent entries)
INSERT INTO vitals (patient_id, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, temperature, recorded_at) VALUES
('p1', 135, 85, 72, 98, 82.5, 36.6, NOW() - INTERVAL '1 day'),
('p2', 128, 80, 68, 97, 65.0, 36.5, NOW() - INTERVAL '2 days'),
('p3', 155, 95, 88, 94, 90.2, 37.1, NOW() - INTERVAL '5 hours'),
('p4', 120, 75, 75, 99, 58.0, 36.7, NOW() - INTERVAL '3 days'),
('p5', 118, 70, 65, 98, 75.0, 36.4, NOW() - INTERVAL '12 hours');

-- 4. CONSULTATIONS
INSERT INTO consultations (patient_id, doctor_id, reason, exam, diagnosis, treatment, note, created_at) VALUES
('p1', 'u1', 'Suivi trimestriel', 'ECG normal, tension légèrement haute', 'Hypertension contrôlée', 'Continuer le traitement actuel', 'Patient essoufflé à l''effort', NOW() - INTERVAL '1 month'),
('p2', 'u1', 'Palpitations nocturnes', 'Pose d''un Holter', 'Suspicion de fibrillation auriculaire', 'Aspirine 100mg', 'Revoir après résultats Holter', NOW() - INTERVAL '2 weeks'),
('p3', 'u1', 'Douleur thoracique', 'ECG montre des signes d''ischémie', 'Angine de poitrine instable', 'Hospitalisation immédiate', 'Cas critique', NOW() - INTERVAL '1 day');

-- 5. PRESCRIPTIONS
INSERT INTO prescriptions (patient_id, doctor_id, content, created_at, expires_at) VALUES
('p1', 'u1', 'Amlodipine 5mg : 1 comprimé le matin\nRamipril 10mg : 1 comprimé le soir', NOW(), NOW() + INTERVAL '6 months'),
('p2', 'u1', 'Kardegic 75mg : 1 sachet par jour\nBisoprolol 2.5mg : 1 comprimé le matin', NOW(), NOW() + INTERVAL '3 months');

-- 6. APPOINTMENTS
INSERT INTO appointments (patient_id, starts_at, duration_minutes, type, status, reason) VALUES
('p1', NOW() + INTERVAL '2 days', 30, 'suivi', 'planifie', 'Contrôle tension'),
('p2', NOW() + INTERVAL '5 days', 45, 'echographie', 'planifie', 'Écho-doppler cardiaque'),
('p4', NOW() + INTERVAL '1 day', 20, 'consultation', 'planifie', 'Premier RDV'),
('p3', NOW() - INTERVAL '2 hours', 60, 'urgence', 'complete', 'Douleur thoracique aiguë');

-- 7. MESSAGES (Chat)
INSERT INTO messages (channel, sender_role, sender_id, content, created_at) VALUES
('patient:p1', 'patient', 'p1', 'Bonjour Docteur, j''ai oublié de vous demander si je peux continuer le sport.', NOW() - INTERVAL '1 day'),
('patient:p1', 'admin', 'u1', 'Bonjour M. Dupont. Oui, la marche rapide est recommandée, mais évitez les efforts violents.', NOW() - INTERVAL '20 hours'),
('patient:p2', 'patient', 'p2', 'Ma tension est à 14/9 ce matin, est-ce normal ?', NOW() - INTERVAL '5 hours'),
('patient:p2', 'admin', 'u1', 'C''est un peu haut. Reprenez-la dans 30 minutes au repos.', NOW() - INTERVAL '4 hours');
