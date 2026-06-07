-- CardioManager Seed Data (Canadian / Franco-Canadien)
-- Run: psql -U postgres -d postgres -f seed.sql

-- Cleanup
TRUNCATE analysis_reports, notifications, appointments, prescriptions, chat_messages, vital_entries, consultations, documents, patient_accounts, secretaire_permissions, patients, users CASCADE;

-- ══════════════════════════════════════════════════════
-- 1. USERS (Staff)
-- ══════════════════════════════════════════════════════
-- Passwords: admin='admin123', secretaire='sec123' (bcrypt hashed)
INSERT INTO users (id, email, username, password_hash, role, full_name, first_name, last_name, initials, title, phone, address, specialty) VALUES
('1', 'e.tremblay@cardiologie-mtl.ca', 'admin', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'admin', 'Dr. Étienne Tremblay', 'Étienne', 'Tremblay', 'ET', 'Dr.', '+1-514-555-1000', '4850 Boulevard de Maisonneuve O, Montréal, QC H3Z 1M1', 'Cardiologie'),
('2', 'mc.gagnon@cardiologie-mtl.ca', 'secretaire', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u', 'secretaire', 'Marie-Claude Gagnon', 'Marie-Claude', 'Gagnon', 'MCG', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 2. PATIENTS
-- ══════════════════════════════════════════════════════
INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status) VALUES
('p1', 'Gérard', 'Bouchard', '1952-08-15', 'M', 'A+', '+1-514-555-0101', 'gerard.bouchard@email.ca', '4850 Boulevard de Maisonneuve O, Montréal, QC H3Z 1M1', 'Canada', 'Mme Bouchard - +1-514-555-0102', 'Pénicilline', 'Hypertension artérielle depuis 2010', 'Hypertension', 'stable'),
('p2', 'Sylvie', 'Roy', '1960-04-22', 'F', 'O-', '+1-418-555-0202', 'sylvie.roy@email.ca', '125 Rue Saint-Jean, Québec, QC G1R 1P2', 'Canada', 'M. Roy - +1-418-555-0203', 'Aucune', 'Fibrillation auriculaire paroxystique', 'Arythmie', 'stable'),
('p3', 'Michel', 'Leblanc', '1945-11-30', 'M', 'B+', '+1-416-555-0303', 'michel.leblanc@email.ca', '350 King Street W, Toronto, ON M5V 3X9', 'Canada', 'Mme Leblanc - +1-416-555-0304', 'Iode, Sulfamides', 'Pontage aortocoronarien 2018, IDM antérieur 2020', 'Post-infarctus', 'critique'),
('p4', 'Caroline', 'Côté', '1978-02-14', 'F', 'AB+', '+1-604-555-0404', 'caroline.cote@email.ca', '850 West Hastings St, Vancouver, BC V6C 1E1', 'Canada', 'M. Côté - +1-604-555-0405', 'Aucune', 'Asthme léger, anxiété', 'Tachycardie sinusale', 'surveillance'),
('p5', 'Alexandre', 'Bergeron', '1985-07-09', 'M', 'A-', '+1-403-555-0505', 'alex.bergeron@email.ca', '150 9th Ave SW, Calgary, AB T2P 2S5', 'Canada', 'Mme Bergeron - +1-403-555-0506', 'Pollens', 'Aucun antécédent cardiaque', 'Palpitations', 'stable'),
('p6', 'Robert', 'Ouellet', '1940-03-18', 'M', 'O+', '+1-514-555-0606', 'robert.ouellet@email.ca', '1200 Rue Sherbrooke E, Montréal, QC H2L 1L6', 'Canada', 'Mme Ouellet - +1-514-555-0607', 'AAS', 'Insuffisance cardiaque congestive, MPOC', 'Insuffisance cardiaque décompensée', 'critique'),
('p7', 'Nathalie', 'Pelletier', '1972-09-25', 'F', 'B-', '+1-613-555-0707', 'nathalie.pelletier@email.ca', '200 Elgin Street, Ottawa, ON K2P 1L5', 'Canada', 'M. Pelletier - +1-613-555-0708', 'Sulfamides', 'Diabète de type 2 depuis 2015, HTA', 'Diabète type 2 + HTA', 'surveillance')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 3. VITAL ENTRIES (2 per patient, critical for p3/p4/p6)
-- ══════════════════════════════════════════════════════
INSERT INTO vital_entries (id, patient_id, recorded_at, systolic, diastolic, heart_rate, sp02, weight) VALUES
('v1', 'p1', NOW() - INTERVAL '1 day', 135, 85, 72, 98, 78.5),
('v2', 'p1', NOW() - INTERVAL '1 week', 142, 88, 76, 97, 79.0),
('v3', 'p2', NOW() - INTERVAL '2 days', 128, 78, 68, 97, 62.5),
('v4', 'p2', NOW() - INTERVAL '2 weeks', 132, 80, 70, 98, 63.0),
('v5', 'p3', NOW() - INTERVAL '5 hours', 155, 95, 112, 91, 88.0),
('v6', 'p3', NOW() - INTERVAL '3 days', 148, 92, 108, 93, 87.5),
('v7', 'p4', NOW() - INTERVAL '1 day', 118, 72, 108, 98, 55.0),
('v8', 'p4', NOW() - INTERVAL '1 week', 122, 74, 105, 99, 55.5),
('v9', 'p5', NOW() - INTERVAL '12 hours', 120, 75, 65, 98, 72.0),
('v10', 'p5', NOW() - INTERVAL '2 days', 118, 72, 62, 99, 71.5),
('v11', 'p6', NOW() - INTERVAL '4 hours', 160, 100, 95, 88, 95.0),
('v12', 'p6', NOW() - INTERVAL '1 week', 155, 98, 92, 90, 94.5),
('v13', 'p7', NOW() - INTERVAL '3 days', 142, 88, 78, 96, 70.0),
('v14', 'p7', NOW() - INTERVAL '5 days', 138, 85, 75, 97, 69.5);

-- ══════════════════════════════════════════════════════
-- 4. PATIENT ACCOUNTS (portal login)
-- ══════════════════════════════════════════════════════
INSERT INTO patient_accounts (patient_id, username, password_hash) VALUES
('p1', 'gerard.bouchard', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u'),
('p2', 'sylvie.roy', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u'),
('p3', 'michel.leblanc', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u'),
('p4', 'caroline.cote', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u'),
('p5', 'alexandre.bergeron', '$2a$10$X7vQ8z9Y5z5z5z5z5z5z5u')
ON CONFLICT (username) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 5. CONSULTATIONS
-- ══════════════════════════════════════════════════════
INSERT INTO consultations (id, patient_id, doctor_id, date, motif, examen, diagnostic, traitement, note, author) VALUES
('c1', 'p1', '1', '2024-12-15', 'Suivi trimestriel HTA', 'ECG normal, TA 135/85', 'Hypertension contrôlée', 'Maintien Amlodipine 5mg et Ramipril 10mg', 'Patient asymptomatique. Bonne observance.', 'Dr. Étienne Tremblay'),
('c2', 'p2', '1', '2024-12-18', 'Palpitations nocturnes', 'Holter 24h posé, ECG normal', 'Suspicion FA paroxystique', 'Apixaban 5mg BID, Bisoprolol 2.5mg', 'Revoir après résultats Holter.', 'Dr. Étienne Tremblay'),
('c3', 'p3', '1', '2024-11-28', 'Douleur thoracique rétrosternale', 'ECG sus-décalage ST V3-V4, troponines élevées', 'IDM antérieur aigu', 'Angioplastie + stent, AAS 80mg, Clopidogrel 75mg', 'Soins intensifs. Évolution favorable.', 'Dr. Étienne Tremblay'),
('c4', 'p4', '1', '2024-12-20', 'Tachycardie et palpitations', 'ECG tachycardie sinusale 108/min, écho normale', 'Tachycardie sinusale inappropriée', 'Bisoprolol 1.25mg die', 'Éliminer cause thyroïdienne.', 'Dr. Étienne Tremblay'),
('c5', 'p5', '1', '2024-12-10', 'Palpitations depuis 3 mois', 'Holter normal, écho normale', 'Palpitations bénignes liées au stress', 'Aucun traitement. Relaxation.', 'Patient jeune et sportif.', 'Dr. Étienne Tremblay'),
('c6', 'p6', '1', '2024-12-22', 'Dyspnée d''effort croissante', 'Écho FEVG 35%, crépitants pulmonaires', 'Insuffisance cardiaque congestive décompensée', 'Furosémide 40mg, Enalapril 5mg, Spironolactone 25mg', 'Surveillance rapprochée.', 'Dr. Étienne Tremblay'),
('c7', 'p7', '1', '2024-12-19', 'Suivi diabète et HTA', 'TA 142/88, HbA1c 7.2%, ECG normal', 'Diabète type 2 partiellement contrôlé, HTA légère', 'Metformine 500mg BID, Lisinopril 10mg die', 'Régime hyposodé. Contrôle 3 mois.', 'Dr. Étienne Tremblay');

-- ══════════════════════════════════════════════════════
-- 6. PRESCRIPTIONS (Canadian drug names)
-- ══════════════════════════════════════════════════════
INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes) VALUES
('rx1', 'p1', 'Gérard Bouchard', CURRENT_DATE, 'Dr. Étienne Tremblay', '[{"name":"Apo-Amlodipine","dosage":"5mg","frequency":"1 comprimé die","duration":"6 mois"},{"name":"Ramipril","dosage":"10mg","frequency":"1 comprimé die","duration":"6 mois"}]', 'Traitement antihypertenseur.'),
('rx2', 'p2', 'Sylvie Roy', CURRENT_DATE, 'Dr. Étienne Tremblay', '[{"name":"Eliquis","dosage":"5mg","frequency":"1 comprimé BID","duration":"6 mois"},{"name":"Bisoprolol","dosage":"2.5mg","frequency":"1 comprimé die","duration":"6 mois"}]', 'Anticoagulation pour FA paroxystique.'),
('rx3', 'p3', 'Michel Leblanc', CURRENT_DATE, 'Dr. Étienne Tremblay', '[{"name":"AAS","dosage":"80mg","frequency":"1 comprimé die","duration":"à vie"},{"name":"Plavix","dosage":"75mg","frequency":"1 comprimé die","duration":"12 mois"},{"name":"Atorvastatine","dosage":"40mg","frequency":"1 comprimé le soir","duration":"à vie"}]', 'Post-IDM. Bithérapie antiplaquettaire.'),
('rx4', 'p6', 'Robert Ouellet', CURRENT_DATE, 'Dr. Étienne Tremblay', '[{"name":"Lasix","dosage":"40mg","frequency":"1 comprimé die","duration":"à vie"},{"name":"Enalapril","dosage":"5mg","frequency":"1 comprimé BID","duration":"à vie"},{"name":"Aldactone","dosage":"25mg","frequency":"1 comprimé die","duration":"à vie"}]', 'Insuffisance cardiaque. Surveillance poids.'),
('rx5', 'p7', 'Nathalie Pelletier', CURRENT_DATE, 'Dr. Étienne Tremblay', '[{"name":"Metformine","dosage":"500mg","frequency":"1 comprimé BID","duration":"à vie"},{"name":"Zestril","dosage":"10mg","frequency":"1 comprimé die","duration":"à vie"}]', 'Diabète type 2 + HTA.');

-- ══════════════════════════════════════════════════════
-- 7. APPOINTMENTS
-- ══════════════════════════════════════════════════════
INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason) VALUES
('a1', 'p1', CURRENT_DATE, '09:00', 30, 'suivi', 'scheduled', 'Contrôle tension artérielle'),
('a2', 'p2', CURRENT_DATE, '10:30', 45, 'echographie', 'scheduled', 'Écho-doppler cardiaque de contrôle'),
('a3', 'p6', CURRENT_DATE, '14:00', 60, 'urgence', 'scheduled', 'Dyspnée aiguë - décompensation cardiaque'),
('a4', 'p4', CURRENT_DATE + INTERVAL '1 day', '09:00', 30, 'consultation', 'scheduled', 'Consultation tachycardie'),
('a5', 'p7', CURRENT_DATE + INTERVAL '1 day', '11:00', 30, 'suivi', 'scheduled', 'Suivi diabète et HTA'),
('a6', 'p3', CURRENT_DATE + INTERVAL '1 day', '15:30', 45, 'suivi', 'scheduled', 'Post-hospitalisation contrôle'),
('a7', 'p1', CURRENT_DATE + INTERVAL '3 days', '08:30', 45, 'bilan', 'scheduled', 'Bilan sanguin complet'),
('a8', 'p5', CURRENT_DATE + INTERVAL '5 days', '13:00', 30, 'consultation', 'scheduled', 'Résultats examens'),
('a9', 'p2', CURRENT_DATE + INTERVAL '7 days', '10:00', 45, 'echographie', 'scheduled', 'Échocardiographie de contrôle'),
('a10', 'p4', CURRENT_DATE + INTERVAL '10 days', '14:30', 30, 'suivi', 'scheduled', 'Suivi traitement tachycardie'),
('a11', 'p5', CURRENT_DATE - INTERVAL '1 day', '11:00', 30, 'consultation', 'complete', 'Consultation initiale'),
('a12', 'p1', CURRENT_DATE - INTERVAL '3 days', '09:30', 30, 'suivi', 'complete', 'Contrôle de routine');

-- ══════════════════════════════════════════════════════
-- 8. CHAT MESSAGES
-- ══════════════════════════════════════════════════════
INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content, is_read, created_at) VALUES
('m1', 'staff', 'admin', '1', NULL, 'Bonjour, je suis disponible pour les consultations aujourd''hui.', true, NOW() - INTERVAL '2 days'),
('m2', 'staff', 'secretaire', '2', NULL, 'Bonjour Dr. Tremblay. Monsieur Leblanc est arrivé pour son rendez-vous.', true, NOW() - INTERVAL '1 day'),
('m3', 'staff', 'admin', '1', NULL, 'Merci. Je le reçois dans 5 minutes.', true, NOW() - INTERVAL '1 day'),
('m4', 'staff', 'secretaire', '2', NULL, 'Les résultats sont sur votre bureau.', true, NOW() - INTERVAL '20 hours'),
('m5', 'staff', 'admin', '1', NULL, 'Je confirme la consultation pour Mme Pelletier à 11h demain.', false, NOW() - INTERVAL '18 hours'),
('m6', 'patient', 'patient', 'p1', 'p1', 'Bonjour Docteur, puis-je reprendre mes promenades quotidiennes ?', true, NOW() - INTERVAL '1 day'),
('m7', 'patient', 'admin', '1', 'p1', 'Oui, la marche modérée est encouragée. Évitez les efforts intenses.', true, NOW() - INTERVAL '20 hours'),
('m8', 'patient', 'patient', 'p2', 'p2', 'Mon pouls était à 100 bpm ce matin. Dois-je m''inquiéter ?', false, NOW() - INTERVAL '5 hours'),
('m9', 'patient', 'patient', 'p3', 'p3', 'Docteur, j''ai ressenti une douleur à la poitrine ce matin en montant les escaliers.', false, NOW() - INTERVAL '3 hours');

-- ══════════════════════════════════════════════════════
-- 9. DOCUMENTS (for Analyse module)
-- ══════════════════════════════════════════════════════
INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES
('doc_1', 'p1', 'ECG - Gérard Bouchard', 'analyse', '1.2 KB', 'uploads/ecg-gerard-bouchard.txt'),
('doc_2', 'p1', 'Bilan sanguin - Gérard Bouchard', 'analyse', '0.8 KB', 'uploads/bilan-gerard-bouchard.txt'),
('doc_3', 'p2', 'Holter 24h - Sylvie Roy', 'analyse', '1.5 KB', 'uploads/holter-sylvie-roy.txt'),
('doc_4', 'p3', 'Échocardiographie - Michel Leblanc', 'echographie', '2.1 KB', 'uploads/echo-michel-leblanc.txt'),
('doc_5', 'p4', 'ECG effort - Caroline Côté', 'analyse', '1.0 KB', 'uploads/ecg-effort-caroline-cote.txt'),
('doc_6', 'p6', 'Radiographie pulmonaire - Robert Ouellet', 'radio', '1.8 KB', 'uploads/radio-robert-ouellet.txt'),
('doc_7', 'p7', 'Bilan glycémique - Nathalie Pelletier', 'analyse', '0.6 KB', 'uploads/bilan-nathalie-pelletier.txt')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 10. ANALYSIS REPORTS
-- ══════════════════════════════════════════════════════
INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by) VALUES
('ar_1', 'p3', '["doc_4"]', '{"summary":"Échocardiographie post-IDM: FEVG à 40%, akinésie antéro-septale.","conclusions":"Risque résiduel modéré. Contrôle dans 3 mois.","grade":"B"}', '1'),
('ar_2', 'p1', '["doc_1","doc_2"]', '{"summary":"ECG: rythme sinusal régulier. Bilan: LDL 2.8 mmol/L, HbA1c 5.9%.","conclusions":"Bonne maîtrise facteurs de risque.","grade":"A"}', '1')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 11. SECRETAIRE PERMISSIONS (all granted)
-- ══════════════════════════════════════════════════════
INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_delete_patients, can_view_appointments, can_edit_appointments, can_delete_appointments, can_view_chat, can_send_chat, can_view_prescriptions, can_edit_prescriptions, can_view_vitals, can_edit_vitals, can_view_documents, can_upload_documents, can_view_consultations)
VALUES ('2', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true)
ON CONFLICT (user_id) DO NOTHING;
