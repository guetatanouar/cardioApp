import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? envFile });

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const firstNames = [
  "Jean",
  "Marie",
  "Ahmed",
  "Samira",
  "Nadia",
  "Omar",
  "Fatima",
  "Youssef",
  "Sophie",
  "Isabelle",
  "Philippe",
  "Bernard",
  "Camille",
  "Luc",
  "Sarah"
];

const lastNames = [
  "Dupont",
  "Martin",
  "Bernard",
  "Petit",
  "Robert",
  "Richard",
  "Durand",
  "Moreau",
  "Simon",
  "Laurent",
  "Lefebvre",
  "Michel",
  "Garcia",
  "David",
  "Fontaine"
];

const pathologies = [
  "HTA",
  "Insuffisance cardiaque",
  "Arythmie",
  "Coronaropathie",
  "Dyslipidémie",
  "Valvulopathie",
  "Suivi post-infarctus"
];

const severity = ["critique", "surveillance", "stable"];

async function upsertUser({ fullName, email, username, password, role }) {
  const hash = await bcrypt.hash(password, 10);
  const result = await client.query(
    `INSERT INTO users (full_name, email, username, password_hash, role)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
     RETURNING id`,
    [fullName, email, username ?? null, hash, role]
  );
  return result.rows[0].id;
}

async function reset() {
  await client.query("TRUNCATE chat_messages, documents, vital_entries, consultations, prescriptions, appointments, patient_accounts, patients, secretaire_permissions, users RESTART IDENTITY CASCADE");
}

await reset();

const adminId = await upsertUser({
  fullName: "Dr. Nom du médecin",
  email: "prenom@cabinet-cardio.fr",
  username: "admin",
  password: "admin123",
  role: "admin"
});

const secretaireId = await upsertUser({
  fullName: "Nom secrétaire",
  email: "secretaire@cabinet-cardio.fr",
  username: "secretaire",
  password: "secre123",
  role: "secretaire"
});

await client.query(
  `INSERT INTO secretaire_permissions (user_id, can_view_patients, can_edit_patients, can_view_appointments, can_edit_appointments, can_view_chat, can_view_prescriptions, can_edit_prescriptions)
   VALUES ($1,true,true,true,true,true,true,false)`,
  [secretaireId]
);

const patientIds = [];
for (let i = 0; i < 25; i++) {
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const dobYear = randInt(1945, 2005);
  const dobMonth = randInt(1, 12);
  const dobDay = randInt(1, 28);
  const dob = `${dobYear}-${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`;

  const sev = pick(severity);
  const pathology = pick(pathologies);

  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@mail.com`;

  const r = await client.query(
    `INSERT INTO patients (
      first_name, last_name, date_of_birth, blood_type, phone, email, address,
      emergency_contact_name, emergency_contact_phone, allergies, medical_history,
      pathology, severity_status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING id`,
    [
      fn,
      ln,
      dob,
      pick(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
      `06${randInt(10000000, 99999999)}`,
      email,
      `${randInt(1, 99)} Rue des Lilas, Lyon`,
      `${pick(firstNames)} ${ln}`,
      `06${randInt(10000000, 99999999)}`,
      pick(["", "Pénicilline", "Aspirine", "Arachides"]),
      pick(["", "Diabète type 2", "Tabagisme", "Antécédents familiaux"]),
      pathology,
      sev
    ]
  );

  const pid = r.rows[0].id;
  patientIds.push(pid);

  const vitalsCount = randInt(5, 12);
  for (let v = 0; v < vitalsCount; v++) {
    const recAt = daysAgo(randInt(1, 180));
    await client.query(
      `INSERT INTO vital_entries (patient_id, recorded_at, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        pid,
        recAt,
        randInt(105, 170),
        randInt(65, 110),
        randInt(55, 120),
        randInt(90, 100),
        (randInt(5500, 9800) / 100).toFixed(2),
        ""
      ]
    );
  }

  const consultCount = randInt(1, 4);
  for (let c = 0; c < consultCount; c++) {
    const createdAt = daysAgo(randInt(5, 365));
    await client.query(
      `INSERT INTO consultations (patient_id, created_at, reason, exam, diagnosis, treatment, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        pid,
        createdAt,
        pick(["Contrôle", "Douleurs thoraciques", "Bilan", "Suivi HTA"]),
        pick(["Auscultation", "ECG", "Échographie", "Bilan biologique"]),
        pick(["RAS", "HTA", "Arythmie", "Coronaropathie stable"]),
        pick(["Adaptation traitement", "Surveillance", "Bêtabloquant", "Statine"]),
        ""
      ]
    );
  }

  const apptCount = randInt(1, 4);
  for (let a = 0; a < apptCount; a++) {
    const starts = daysAgo(randInt(-5, 30));
    await client.query(
      `INSERT INTO appointments (patient_id, starts_at, duration_minutes, type, status, reason, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        pid,
        starts,
        pick([15, 20, 30, 45]),
        pick(["suivi", "urgence", "bilan", "echographie", "consultation"]),
        pick(["planifie", "complete", "annule", "urgent"]),
        pick(["Suivi", "Bilan", "Contrôle tension", "Échographie"]),
        ""
      ]
    );
  }

  await client.query(
    `INSERT INTO prescriptions (patient_id, general_notes, items)
     VALUES ($1,$2,$3)`,
    [
      pid,
      "",
      JSON.stringify([
        {
          name: pick(["Atorvastatine", "Bisoprolol", "Ramipril", "Aspirine"]),
          dosage: pick(["5mg", "10mg", "20mg"]),
          frequency: pick(["1x/jour", "2x/jour"]),
          duration: pick(["30 jours", "90 jours"]),
          instructions: ""
        }
      ])
    ]
  );
}

for (let i = 0; i < 3; i++) {
  const pid = patientIds[i];
  const username = `patient${i + 1}`;
  const hash = await bcrypt.hash("patient123", 10);
  await client.query(
    `INSERT INTO patient_accounts (patient_id, username, password_hash, is_active)
     VALUES ($1,$2,$3,true)`,
    [pid, username, hash]
  );
}

await client.query(
  `INSERT INTO chat_messages (channel, sender_role, sender_id, content, is_read)
   VALUES ('staff', 'admin', $1, 'Bonjour, point rapide sur la journée.', false)`,
  [adminId]
);

await client.query(
  `INSERT INTO chat_messages (channel, sender_role, sender_id, content, is_read)
   VALUES ('staff', 'secretaire', $1, '3 RDV urgents à confirmer.', false)`,
  [secretaireId]
);

// eslint-disable-next-line no-console
console.log("Seed completed");
await client.end();
