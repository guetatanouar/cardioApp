CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','secretaire')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS secretaire_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view_patients boolean NOT NULL DEFAULT true,
  can_edit_patients boolean NOT NULL DEFAULT true,
  can_view_appointments boolean NOT NULL DEFAULT true,
  can_edit_appointments boolean NOT NULL DEFAULT true,
  can_view_chat boolean NOT NULL DEFAULT true,
  can_view_prescriptions boolean NOT NULL DEFAULT true,
  can_edit_prescriptions boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  blood_type text,
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text,
  medical_history text,
  pathology text,
  severity_status text NOT NULL DEFAULT 'stable' CHECK (severity_status IN ('critique','surveillance','stable')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  exam text,
  diagnosis text,
  treatment text,
  note text
);

CREATE TABLE IF NOT EXISTS vital_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  systolic_bp int,
  diastolic_bp int,
  heart_rate int,
  spo2 int,
  weight_kg numeric(5,2),
  note text
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  sender_role text NOT NULL,
  sender_id uuid,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'planifie' CHECK (status IN ('planifie','complete','annule','urgent')),
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  general_notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb
);
