import { query } from './pool.js';

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'secretaire')),
    initials VARCHAR(5),
    title VARCHAR(150),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
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
    severity_status VARCHAR(20) DEFAULT 'stable',
    pathology VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_accounts (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20) UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultations (
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

CREATE TABLE IF NOT EXISTS vital_entries (
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

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(40) PRIMARY KEY,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('staff', 'patient')),
    patient_id VARCHAR(20) REFERENCES patients(id) ON DELETE CASCADE,
    from_name VARCHAR(150) NOT NULL,
    from_role VARCHAR(30) NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(40) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('analyse', 'radio', 'echographie', 'autre')),
    size VARCHAR(30),
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
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

CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(40) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    medications JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS secretaire_permissions CASCADE;

CREATE TABLE IF NOT EXISTS secretaire_permissions (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_view_patients BOOLEAN DEFAULT FALSE,
    can_edit_patients BOOLEAN DEFAULT FALSE,
    can_delete_patients BOOLEAN DEFAULT FALSE,
    can_view_appointments BOOLEAN DEFAULT FALSE,
    can_edit_appointments BOOLEAN DEFAULT FALSE,
    can_delete_appointments BOOLEAN DEFAULT FALSE,
    can_view_chat BOOLEAN DEFAULT FALSE,
    can_send_chat BOOLEAN DEFAULT FALSE,
    can_view_prescriptions BOOLEAN DEFAULT FALSE,
    can_edit_prescriptions BOOLEAN DEFAULT FALSE,
    can_view_vitals BOOLEAN DEFAULT FALSE,
    can_edit_vitals BOOLEAN DEFAULT FALSE,
    can_view_documents BOOLEAN DEFAULT FALSE,
    can_upload_documents BOOLEAN DEFAULT FALSE,
    can_view_consultations BOOLEAN DEFAULT FALSE
);
`;

async function migrate() {
    try {
        console.log('Starting migration...');
        await query(schema);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
