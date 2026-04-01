CARDIOMANAGER - PROMPT COMPLET DU PROJET
========================================

1. VUE D'ENSEMBLE
------------------
Application web de gestion de cabinet de cardiologie avec authentification multi-rôles,
interface moderne responsive, et base de données PostgreSQL pour combiner un dashboard
médical professionnel avec un portail patient sécurisé.


2. STACK TECHNIQUE
------------------

2.1 Frontend
- Next.js 15 : App Router, Server Components
- TypeScript : Mode strict
- TailwindCSS : Stylisme utilitaire
- shadcn/ui : Bibliothèque de composants
- Lucide React : Icônes
- Recharts : Graphiques
- React Query : Gestion des données (optionnel)

2.2 Backend
- Express.js : API REST
- TypeScript : Sécurité des types
- PostgreSQL : Base de données
- pg : Client PostgreSQL
- JWT : Tokens d'authentification
- bcryptjs : Hachage des mots de passe
- multer : Gestion des fichiers uploadés
- cors : Cross-origin

2.3 Développement
- ESLint
- Prettier
- ts-node-dev
- dotenv


3. DESIGN & UI/UX
-----------------

3.1 Système de couleurs

/* Primary (Medical) */
--primary-blue: #3B82F6
--primary-purple: #9333EA
--primary-green: #10B981
--primary-red: #EF4444

/* Semantic */
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6

/* Grayscale */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827

/* Dark theme */
--dark-bg: #111827
--dark-surface: #1F2937
--dark-border: #374151

3.2 Typographie
- Titres : Inter, font-bold, leading-tight
- Texte : Inter, font-normal, text-sm
- Code : JetBrains Mono, font-mono

3.3 Composants UI
- Cards : rounded-2xl, shadow-xl, bg-white
- Buttons : rounded-xl, font-semibold, shadow-md
- Inputs : rounded-xl, border-gray-200, focus:ring-2
- Badges : rounded-full, px-2 py-0.5, text-xs
- Modals : rounded-3xl, shadow-2xl

3.4 Layout Structure
+--------------------------------------------------+
| Header (64px)                                    |
| Logo | Search | Lang | Theme | Notifs | Profile  |
+--------+-----------------------------------------+
|        |                                         |
| Sidebar| Main Content                            |
|(240px) |                                         |
|        | Page Header                             |
| - Dash |                                         |
| - Patients | Filters/Search                      |
| - Agenda |                                       |
| - Chat  | Main Area                              |
| - Ordo  |                                         |
| - Suivi | Actions                                |
| - Param |                                         |
|        |                                         |
+--------+-----------------------------------------+


4. STRUCTURE DU PROJET
----------------------

cardio-manager/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx
│   │   ├── patients/
│   │   ├── agenda/
│   │   ├── chat/
│   │   ├── prescriptions/
│   │   ├── suivi/
│   │   └── parametres/
│   ├── layout.tsx
│   ├── login/
│   ├── patient/
│   │   └── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── AuthProviderWrapper.tsx
├── lib/
│   ├── auth.tsx
│   ├── api.tsx
│   ├── types.tsx
│   ├── utils.tsx
│   ├── i18n.tsx
│   ├── ThemeContext.tsx
│   ├── LanguageContext.tsx
│   ├── mockData.tsx
│   └── patientStore.tsx
└── server/
    ├── routes/
    │   ├── auth.ts
    │   ├── patients.ts
    │   ├── consultations.ts
    │   ├── vitals.ts
    │   ├── documents.ts
    │   ├── chat.ts
    │   └── appointments.ts
    ├── middleware/
    │   └── auth.ts
    ├── db/
    │   ├── pool.ts
    │   ├── migrate.ts
    │   └── seed.ts
    ├── uploads/
    ├── index.ts
    ├── .env
    └── package.json
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .gitignore


5. VARIABLES D'ENVIRONNEMENT
----------------------------

Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000

Backend (server/.env)
DATABASE_URL=postgresql://postgres@localhost:5432/cardio_manager
JWT_SECRET=your-super-secret-jwt-key
PORT=4000
UPLOAD_DIR=./uploads


6. CONFIGURATION DE LA BASE DE DONNÉES
--------------------------------------

# 1. Cluster PostgreSQL
initdb -D C:\Intact_Temp\Apps\pgsql\data
PG_ctl start -D C:\Intact_Temp\Apps\pgsql\data

# 2. Créer la base de données
createdb cardio_manager

# 3. Exécuter les migrations
npm run db:migrate

# 4. Initialiser les données de démonstration
npm run db:seed


7. COMMANDES DE PRODUCTION
--------------------------

# Frontend
npm run build
npm start

# Backend
npm run build
npm start


8. SCHÉMA BASE DE DONNÉES POSTGRESQL
------------------------------------

-- Users (staff: admin, secretaire)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'secretaire')),
    initials VARCHAR(5) NOT NULL,
    title VARCHAR(150),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    blood_type VARCHAR(5),
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    emergency_contact TEXT,
    allergies TEXT[] DEFAULT '{}',
    medical_history TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patient login accounts
CREATE TABLE patient_accounts (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20) UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Consultation notes
CREATE TABLE consultations (
    id VARCHAR(20) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    motif TEXT NOT NULL,
    examen TEXT,
    diagnostic TEXT,
    traitement TEXT,
    note TEXT,
    author VARCHAR(150),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vital entries (patient self-reporting)
CREATE TABLE vital_entries (
    id VARCHAR(40) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT NOW(),
    systolic INT,
    diastolic INT,
    heart_rate INT,
    weight NUMERIC(5,1),
    sp02 INT,
    note TEXT
);

-- Chat messages
CREATE TABLE chat_messages (
    id VARCHAR(40) PRIMARY KEY,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('staff', 'patient')),
    patient_id VARCHAR(20) REFERENCES patients(id) ON DELETE CASCADE,
    from_name VARCHAR(150) NOT NULL,
    from_role VARCHAR(30) NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
    id VARCHAR(40) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('analyse', 'radio', 'echographie', 'autre')),
    size VARCHAR(30),
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id VARCHAR(20) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    duration INT NOT NULL DEFAULT 30,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
    id VARCHAR(40) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    medications JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Secretarial permissions
CREATE TABLE secretarial_permissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, permission)
);


9. AUTHENTIFICATION & PERMISSIONS
---------------------------------

9.1 Rôles & Accès
- Admin : Accès complet à tout
- Secrétaire : Accès configurable granulaire
- Patient : Accès limité à son espace personnel

9.2 JWT Tokens
interface JwtPayload {
    id: number;
    username: string;
    role: 'admin' | 'secretaire' | 'patient';
    name: string;
    patientId?: string;
    iat: number;
    exp: number;
}

9.3 Permissions Secrétaire
type SecretairePermissions = {
    viewPatients: boolean;
    createPatients: boolean;
    editPatients: boolean;
    deletePatients: boolean;
    viewAppointments: boolean;
    createAppointments: boolean;
    editAppointments: boolean;
    deleteAppointments: boolean;
    viewConsultations: boolean;
    createConsultations: boolean;
    editConsultations: boolean;
    deleteConsultations: boolean;
    viewDocuments: boolean;
    uploadDocuments: boolean;
    deleteDocuments: boolean;
    viewVitals: boolean;
    addVitals: boolean;
    managePatientAccounts: boolean;
    viewPrescriptions: boolean;
    createPrescriptions: boolean;
    editPrescriptions: boolean;
    deletePrescriptions: boolean;
};


10. FONCTIONNALITÉS DÉTAILLÉES
------------------------------

10.1 Dashboard (Admin/Secrétaire)
- Statistiques : nb patients, RDV du jour, messages non lus, alertes
- Alertes critiques : SpO2 < 94%, FC > 100 bpm, prise de poids > 2kg/48h
- RDV du jour : liste avec statut, patient, heure, type
- Activité récente : dernières consultations, documents uploadés
- Graphiques mini : évolution patients, RDV par semaine

10.2 Patients
- Liste paginée avec recherche/filtres (nom, pathologie, statut)
- Badges sévérité : critique (rouge), surveillance (orange), stable (vert)
- Fiche patient avec 5 onglets :
  * Infos personnelles + contact + allergies + antécédents
  * Consultations : historique complet avec notes médicales
  * Vitaux : graphiques TA/FC/poids/SpO2 par période
  * Documents : upload/download par catégorie
  * Messagerie : chat patient → médecin
- Actions CRUD : créer, modifier, supprimer patient

10.3 Agenda
- Vue semaine + vue liste
- RDV colorés : suivi (bleu), urgence (rouge), bilan (violet), échographie (vert)
- Création/édition : patient, date, heure, durée, type, motif, notes
- Filtres : par type, statut, patient

10.4 Chat
- Canal staff : admin ↔ secrétaire
- Canaux patients : un canal par patient actif
- Indicateurs : messages non lus, last message timestamp
- Polling : rafraîchissement toutes les 2 secondes

10.5 Ordonnances
- Liste par patient avec date/médecin
- Création : liste médicaments (nom, dosage, fréquence, durée, instructions)
- Notes générales sur l'ordonnance
- Export PDF (impression)

10.6 Suivi (Graphiques)
- Métriques : TA systolique, TA diastolique, FC, poids, SpO2
- Périodes : 1 mois, 3 mois, 6 mois, 1 an
- Patient : sélection par recherche ou liste
- Charts : Recharts avec courbes lissées, points de données

10.7 Espace Patient (/patient)
- Vue constante vitales : graphiques personnels
- Saisie constante : formulaire TA, FC, poids, SpO2, note
- Documents : upload, téléchargement, suppression
- Messagerie : chat avec le médecin
- Consultations : historique (lecture seule)

10.8 Paramètres
- Profil utilisateur : nom, email, mot de passe
- Permissions secrétaire : toggles granulaires
- Comptes patients : créer, activer/désactiver, reset password
- Langue : FR / EN / AR (support RTL)
- Thème : Light / Dark mode


11. COMPOSANTS UI SPÉCIFIQUES
-----------------------------

11.1 Header Component
interface HeaderProps {
    user: AuthUser | null;
    notifications: AppNotifications[];
    onLogout: () => void;
}
Fonctionnalités : Logo, recherche, sélecteur langue, toggle thème, badge notifications, profil

11.2 Sidebar Component
interface SidebarProps {
    user: AuthUser | null;
    activePath: string;
    notifications: { staff: number; patient: Record<string, number>; };
}
Fonctionnalités : Navigation avec icônes, badges notifications, collapse/expand, responsive

11.3 Patient Card Component
interface PatientCardProps {
    patient: Patient;
    onSelect: (patient: Patient) => void;
}
Fonctionnalités : Avatar avec initiales, badge sévérité, date dernière consultation, actions rapides

11.4 Vital Chart Component
interface VitalChartProps {
    patientId: string;
    metric: 'systolic' | 'diastolic' | 'heartRate' | 'weight' | 'spo2';
    period: '1M' | '3M' | '6M' | '9M' | '1Y';
}
Fonctionnalités : Graphique courbes Recharts, points au survol, sélecteur période, export CSV


12. INTERNATIONALISATION (I18N)
-------------------------------

12.1 Langues supportées
- Français (par défaut)
- English
- العربية (Arabe - RTL)

12.2 Structure des clés de traduction
interface I18nKeys {
    nav: {
        dashboard: string; patients: string; agenda: string;
        chat: string; prescriptions: string; suivi: string; parametres: string;
    };
    auth: {
        login: string; password: string; forgotPassword: string;
        patientLogin: string; notificationMain: string;
    };
    patients: {
        list: string; create: string; edit: string; delete: string;
        search: string; filter: string; vitalHistory: string;
        consultations: string; documents: string;
    };
}

12.3 Support RTL
- dir="rtl" sur <html> pour l'arabe
- Tailwind rtl prefixes
- Flex direction inversée pour sidebar


13. DONNÉES DE DÉMONSTRATION (SEED)
-----------------------------------

13.1 Utilisateurs Staff
- Admin : p.moreau@cabinet-cardio.fr / admin123
- Secrétaire : s.dubois@cabinet-cardio.fr / sec123

13.2 Patients (25 exemples)
- Jean Dupont (p1) - HTA + Diabète type 2
- Claire Martin (p2) - Insuffisance cardiaque
- Michel Bernard (p3) - Coronaropathie
- ... 22 autres patients réalistes

13.3 Comptes Patients Actifs
- jean.dupont / jean123
- claire.martin / claire123
- m.bernard / michel123

13.4 Données Seed
- 35 entrées vitales (historique 2024 + 2025)
- 25 rendez-vous (aujourd'hui, semaine, passés)
- 4 consultations (patients p1, p2, p3)
- 11 messages chat (staff + patient)
- 5 ordonnances (médicaments détaillés)


14. OBJECTIFS TECHNIQUES
------------------------

1. Performance : temps de chargement < 2s, taille bundle < 500KB
2. Sécurité : JWT, bcrypt, validation stricte
3. Accessibilité : WCAG 2.1 AA, navigation clavier
4. Responsive : desktop-first, support mobile
5. Mode hors-ligne : fallback si API indisponible
6. Scalabilité : architecture modulaire, base de données indexée