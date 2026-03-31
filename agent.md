Tu es un expert en développement full-stack. Crée une application web complète
de gestion de cabinet de cardiologie appelée "CardioManager".

## Stack technique
- Frontend : Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, Lucide icons
- Backend : Node.js + Express + PostgreSQL (SQL), JWT, bcryptjs, multer
- Auth : JWT avec rôles (admin, secrétaire, patient)
- i18n : Support FR / EN / AR (RTL pour l’arabe)
- Thème : light / dark mode

---

## Rôles utilisateurs

### 1. Admin (Dr. Nom du médecin)
- Login : prenom@cabinet-cardio.fr / admin123
- Accès complet à tout le système

### 2. Secrétaire (Nom secrétaire)
- Login : secretaire@cabinet-cardio.fr / secre123
- Accès configurable par l’admin (permissions granulaires)

### 3. Patient
- Login via identifiant créé par la secrétaire
- Accès à son espace personnel uniquement

---

## Pages & Features

### Dashboard (admin/secrétaire)
- Statistiques : patients totaux, RDV du jour, messages non lus, alertes critiques
- Liste des RDV du jour (statuts : confirmés, planifiés, urgents)
- Alertes patients critiques (SpO2 < 95%, FC > 100 bpm, etc.)
- Activité récente (dernières consultations, documents uploadés)
- Accès rapide aux actions courantes

### Patients
- Liste paginée avec recherche/filtres (nom, pathologie, statut)
- Badges de sévérité (critique, surveillance, stable)
- Fiche patient complète :
  - Infos personnelles (nom, DDN, groupe sanguin, téléphone, email, adresse)
  - Contact urgence + allergies + antécédents médicaux
  - Onglet Consultations (historique des notes médicales)
  - Onglet Constantes vitales (graphiques évolutifs : TA systolique/diastolique, FC, poids, SpO2)
  - Onglet Documents (ordonnances, radios, analyses, échographies)
  - Onglet Messagerie (chat patient/médecin)
  - Onglet Compte patient (gestion accès, username/password)
- Création/modification de patient
- Ajout de consultation (motif, examen, diagnostic, traitement, note)
- Saisie de constantes vitales
- Upload de documents (PDF, images) avec catégorie

### Agenda
- Vue semaine / vue liste
- RDV avec code couleur par type (suivi, urgence, bilan, échographie, consultation)
- Statuts : planifié, complété, annulé, urgent
- Création/modification de RDV (patient, date, heure, durée, type, motif, notes)
- Filtres par type et statut

### Chat
- Canal staff (admin + secrétaire)
- Canaux patients (un canal par patient actif)
- Indicateur de messages non lus
- Envoi/réception temps réel (polling)

### Ordonnances
- Liste des ordonnances par patient
- Création d’ordonnance avec liste de médicaments (nom, dosage, fréquence, durée, instructions)
- Notes générales sur l’ordonnance
- Impression / export PDF

### Suivi (vue graphiques)
- Graphiques d’évolution des constantes vitales par patient
- Filtres par période (1 mois, 3 mois, 6 mois, 1 an)
- Métriques : TA systolique, TA diastolique, FC, poids, SpO2

### Paramètres
- Profil utilisateur (nom, email, mot de passe)
- Permissions secrétaire (toggles granulaires par feature)
- Gestion comptes patients (créer, activer/désactiver, changer mot de passe)
- Préférences : langue (FR/EN/AR), thème (light/dark)

---

## Espace Patient (portail séparé /patient)
- Vue constantes vitales personnelles avec graphiques
- Saisie de nouvelles constantes (TA, FC, poids, SpO2, note)
- Documents personnels (upload, téléchargement, suppression)
- Messagerie avec le médecin
- Historique des consultations (lecture seule)

---

## Backend Express API (port 4000)

### Endpoints
- POST /api/auth/login → login staff (email ou username)
- POST /api/auth/patient-login → login patient
- GET/POST /api/patients → liste et création patients
- GET/PUT /api/patients/:id → fiche et modification patient
- GET/POST /api/patients/:id/consultations → consultations
- GET/POST /api/patients/:id/vitals → constantes vitales
- GET/POST/DELETE /api/patients/:id/documents → documents
- GET/POST /api/chat → messages chat
- GET/POST /api/appointments → rendez-vous
- GET/POST /api/prescriptions → ordonnances

---

## Base de données PostgreSQL
Tables : users, patients, patient_accounts, consultations,
vital_entries, chat_messages, documents, appointments,
prescriptions, secretaire_permissions

---

## Seed initial
- 2 comptes staff (admin + secrétaire)
- 25 patients cardiologiques réalistes
- 3 comptes patients actifs
- Historique vitaux, consultations, RDV, ordonnances, messages

---

## Contraintes UX/UI
- Interface moderne, responsive
- Utilisation de shadcn/ui
- UX claire et rapide (dashboard médical)
- Gestion des états (loading, empty, error)


Contraintes UX/UI
Design médical professionnel, moderne et sobre
Sidebar de navigation avec badges de notifications
Header avec recherche globale, sélecteur de langue, thème, notifications, profil
Responsive (desktop prioritaire)
Toasts de confirmation pour les actions CRUD
Modales pour création/édition
Graphiques avec recharts
Fallback mock si API indisponible (mode offline)
Résumé des features

Module | Features

Auth
JWT, 3 rôles, login email/username, session localStorage

Dashboard
Stats, RDV du jour, alertes critiques, activité récente

Patients
Liste+filtres, fiche complète, 5 onglets, CRUD

Consultations
Historique, ajout avec tous champs médicaux

Vitaux
Saisie + graphiques évolutifs multi-métriques

Documents
Upload/download/delete, 4 catégories

Agenda
Vue semaine+liste, RDV colorés, CRUD

Chat
Canal staff + canaux patients, non-lus

Ordonnances
Médicaments détaillés, impression

Suivi
Graphiques par période et patient

Paramètres
Profil, permissions secrétaire, comptes patients

Portail patient
Vitaux, documents, messagerie, consultations

i18n
FR / EN / AR avec RTL

Thème
Light / Dark mode

Backend
Express + PostgreSQL, 10+ routes REST, seed 25 patients