# CardioManager — Application de Gestion de Cabinet de Cardiologie

## Concept
Application web full-stack de gestion d'un cabinet de cardiologie avec 3 portails : médecin (admin), secrétaire, et patient. Interface médicale professionnelle, moderne, responsive, multilingue (FR/EN/AR+RTL), avec dark/light mode.

## Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, Lucide icons, Recharts
- **Backend**: Express.js, TypeScript, PostgreSQL (pg), JWT (jsonwebtoken), bcryptjs, multer
- **Auth**: JWT 8h, bcrypt, 3 rôles (admin, secretaire, patient), permissions granulaires secrétaire

## Rôles & Accès
| Rôle | Login | Accès |
|---|---|---|
| Admin (médecin) | Email + mdp | Tout |
| Secrétaire | Email + mdp | Configurable (15 toggles par l'admin) |
| Patient | Username + mdp (créé par secrétaire) | Son espace uniquement |

## Layout

Header (64px): Logo · Recherche globale · Langue (FR/EN/AR) · Thème · Notifications · Profil  
Sidebar (240px): Dashboard · Patients · Agenda · Chat · Ordonnances · Suivi · Paramètres  
Main: Contenu de la page active

Patient portal = layout séparé sans sidebar (/patient).

## Pages & Features

### Login
- 2 onglets : "Personnel médical" (sélecteur profil admin/secrétaire + mdp) et "Espace patient" (username + mdp)
- Comptes démo visibles et cliquables pour remplissage auto

### Dashboard
- 4 stats : nb patients, RDV du jour, messages non lus, alertes critiques
- Liste RDV du jour (statut, patient, heure, type)
- Alertes patients critiques (Sp02 < 94%, FC > 100, prise poids > 2kg/48h)
- Activité récente

### Patients
- Liste paginée + recherche + filtres (nom, pathologie)
- Badges sévérité : critique (rouge), surveillance (orange), stable (vert)
- Fiche patient 5 onglets :
  - **Infos** : identité, contact, urgence, allergies, antécédents
  - **Consultations** : historique (motif, examen, diagnostic, traitement, note, auteur)
  - **Constantes** : graphiques Recharts (TA, FC, poids, Sp02) filtrable par période (1M/3M/6M/1A)
  - **Documents** : upload/download/delete, 4 catégories (analyse, radio, échographie, autre)
  - **Messagerie** : chat patient@médecin

### Agenda
- Vue semaine + vue liste
- Code couleur : suivi (bleu), urgence (rouge), bilan (violet), échographie (vert), consultation (gris)
- CRUD RDV : patient, date, heure, durée, type, motif, notes

### Chat
- Canal staff (admin → secrétaire)
- Canaux patients (1 par patient)
- Badge messages non lus, polling 2s

### Ordonnances
- Liste par patient/date/médecin
- Création : médicaments [{nom, dosage, fréquence, durée, instructions}] + notes
- Impression/export

### Suivi
- Graphiques évolutifs par patient et métrique
- Sélecteur période + patient

### Paramètres
- Profil, permissions secrétaire (toggles), comptes patients (CRUD), langue, thème

### Portail Patient (/patient)
- Constantes : saisie + graphiques personnels
- Documents : upload/téléchargement/suppression
- Messagerie avec le médecin
- Consultations (lecture seule)

## Schéma BD

```sql
users (id SERIAL PK, username UNIQUE, email UNIQUE, password, name, role, initials, title)
patients (id VARCHAR PK, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies TEXT[], medical_history TEXT[])
patient_accounts (id SERIAL PK, patient_id FK UNIQUE → patients, username UNIQUE, password, active)
consultations (id VARCHAR PK, patient_id FK → patients, date, motif, examen, diagnostic, traitement, note, author)
vital_entries (id VARCHAR PK, patient_id FK → patients, recorded_at, systolic INT, diastolic INT, heart_rate INT, weight NUMERIC, sp02 INT, note)
chat_messages (id VARCHAR PK, channel CHECK(staff/patient), patient_id FK → patients, from_name, from_role, text, read BOOLEAN)
documents (id VARCHAR PK, patient_id FK → patients, name, category CHECK(analyse/radio/echographie/autre), size, file_path)
appointments (id VARCHAR PK, patient_id FK → patients, patient_name, date DATE, time, duration INT, type, status, reason, notes)
prescriptions (id VARCHAR PK, patient_id FK → patients, patient_name, date DATE, doctor_name, medications JSONB, notes)
secretaire_permissions (id SERIAL PK, user_id FK → users, permission, granted BOOLEAN, UNIQUE(user_id, permission))

Toutes les tables ont created_at TIMESTAMP DEFAULT NOW().
CASCADE DELETE sur patient_id.

API Endpoints (Express port 4000, préfixe /api)
Méthode	Endpoint	Description
POST	/auth/login	Staff login (email ou username)
POST	/auth/patient-login	Patient login
GET	/patients	Liste patients
POST	/patients	Créer patient
GET	/patients/:id	Fiche patient
PUT	/patients/:id	Modifier patient
GET	/patients/:id/consultations	Consultations patient
POST	/patients/:id/consultations	Ajouter consultation
GET	/patients/:id/vitals	Constantes patient
POST	/patients/:id/vitals	Ajouter constantes
GET	/patients/:id/documents	Documents patient
POST	/patients/:id/documents	Upload document (multipart)
DELETE	/documents/:id	Supprimer document
GET	/chat?channel=&patientId=	Messages chat
POST	/chat	Envoyer message
GET	/appointments	RDV
POST	/appointments	Ajouter RDV
PUT	/appointments/:id	Modifier RDV
GET	/prescriptions	Ordonnances
POST	/prescriptions	Créer ordonnance
Middleware JWT sur toutes les routes sauf login. CORS autorisé.

## Design System
couleurs : blue-600 (admin), purple-600 (secrétaire), green-600 (patient/succès), red-500 (urgence/erreur), amber-500 (warning)

cards : rounded-xl, bg-white / dark:bg-gray-800

buttons : rounded-xl, font-semibold, shadow-md

inputs : rounded-xl, border-gray-200, focus:ring-2

badges : rounded-full, text-xs

Dark mode : bg-gray-900, surface bg-gray-800, border-gray-700

Seed (données démo)
2 staff, 25 patients cardiologiques réalistes, 3 comptes patients

35 entrées vitales, 25 RDV, 4 consultations, 11 messages, 5 ordonnances

## Ordre d'implémentation

Auth + Layout (Header/Sidebar) + Login page

Dashboard + Patients CRUD

Consultations + Constantes vitales + Graphiques

Agenda + Documents upload

Chat + Notifications

Ordonnances

Portail patient

i18n (FR/EN/AR) + Dark mode

Permissions secrétaire + Paramètres