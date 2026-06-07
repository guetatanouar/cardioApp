# Mise à jour des données de test — Données canadiennes

## 1. Fichiers contenant les données canadiennes

| Fichier | Rôle |
|---|---|
| `server/db/seed.ts` | Script TypeScript principal de seed (s'exécute avec `tsx`) |
| `server/dist/db/seed.js` | Version compilée du seed (utilisée si le serveur n'est pas rebuild) |
| `schema.sql` | Schéma + seed SQL (lignes 167-250) |
| `seed.sql` | Script SQL autonome |

## 2. Effacer les anciennes données et insérer les nouvelles

### Méthode A — Via le script TypeScript (recommandé)

```bash
cd server
npx tsx db/seed.ts
```

Ce script TRUNCATE toutes les tables, puis insère :

- 2 utilisateurs (admin + secretaire)
- 7 patients canadiens (noms franco-canadiens, adresses QC/ON/BC/AB)
- 5 comptes patients (portail patient)
- 14 relevés de signes vitaux (dont 3 critiques : SpO2 < 94%, HR > 100)
- 7 consultations
- 12 rendez-vous (aujourd'hui, futur, passés)
- 5 prescriptions (médicaments canadiens : Apo-Amlodipine, Eliquis, Plavix, Lasix, Aldactone, Zestril)
- 7 documents
- 9 messages de chat (dont 2 non lus)
- 2 rapports d'analyse
- 1 jeu de permissions secrétaire

### Méthode B — Via les scripts SQL

```bash
# Option 1 : schema.sql (contient schéma + seed)
psql -U postgres -d postgres -f schema.sql

# Option 2 : seed.sql (seed uniquement)
psql -U postgres -d postgres -f seed.sql
```

### Méthode C — Via le serveur

```bash
cd server
npm run db:seed
```

## 3. Lancer le projet

### Backend

```bash
cd server
npm run dev
```

Le serveur démarre sur `http://localhost:5000`.

### Frontend

```bash
# Depuis la racine du projet
npm run dev
```

L'application démarre sur `http://localhost:3000`.

## 4. Identifiants de connexion

| Utilisateur | Identifiant | Mot de passe | Rôle |
|---|---|---|---|
| Dr. Étienne Tremblay | `admin` | `admin123` | admin |
| Marie-Claude Gagnon | `secretaire` | `sec123` | secretaire |
| Gérard Bouchard | `gerard.bouchard` | `gerard123` | patient |
| Sylvie Roy | `sylvie.roy` | `sylvie123` | patient |
| Michel Leblanc | `michel.leblanc` | `michel123` | patient |
| Caroline Côté | `caroline.cote` | `caroline123` | patient |
| Alexandre Bergeron | `alexandre.bergeron` | `alex123` | patient |

## 5. Commit et push

```bash
# Voir l'état des modifications
git status

# Ajouter tous les fichiers modifiés
git add schema.sql seed.sql server/db/seed.ts server/dist/db/seed.js server/dist/routes/consultations.js server/dist/routes/prescriptions.js server/dist/routes/patients.js server/routes/consultations.ts server/routes/prescriptions.ts server/routes/patients.ts app/login/page.tsx app/dashboard/patients/page.tsx app/dashboard/chat/page.tsx app/patient/profile/page.tsx components/Header.tsx components/shell/app-shell.tsx

# Commiter
git commit -m "Remplacement des données de test par des données canadiennes

- Patients, adresses, médicaments et personnel canadiens
- 3 alertes critiques pour test du tableau de bord
- Rendez-vous aujourd'hui, futur et passés
- Messages non lus pour test des notifications
- Identifiants : admin/admin123, secretaire/sec123"

# Pusher
git push
```

## 6. Vérification après déploiement

- Tableau de bord : 3 alertes critiques (Michel Leblanc SpO2 91% HR 112, Robert Ouellet SpO2 88%, Caroline Côté HR 108)
- 3 rendez-vous aujourd'hui (Gérard Bouchard 09:00, Sylvie Roy 10:30, Robert Ouellet 14:00)
- Messages non lus de Sylvie Roy et Michel Leblanc dans le chat
- Portail patient : 5 comptes fonctionnels
