import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';

const upload = multer({ dest: 'uploads/' });
export const patientsRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KNOWN_COUNTRIES = [
  'CA','US','FR','BE','CH','DZ','MA','TN','GB','DE','IT','ES',
  'NL','PT','SE','AT','DK','FI','IE','LU','GR','PL','CZ','HU',
  'RO','BG','HR','SK','SI','EE','LV','LT','MT','SA','AE','QA',
  'EG','LB','SY','TR'
];

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

function validateCountry(country: string): boolean {
  if (!country) return true;
  return KNOWN_COUNTRIES.includes(country);
}

function normalizeEmail(email: string): string {
  return email.toString().trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.toString().replace(/\s/g, '').trim();
}

async function checkDuplicatePatient(data: { email?: string; first_name: string; last_name: string; phone?: string; excludeId?: string }) {
  const email = data.email ? normalizeEmail(data.email) : '';
  const phone = data.phone ? normalizePhone(data.phone) : '';

  if (email) {
    const existing = await query(
      'SELECT id, email, first_name, last_name, phone, created_at, severity_status FROM patients WHERE email = $1' + (data.excludeId ? ' AND id != $2' : ''),
      data.excludeId ? [email, data.excludeId] : [email]
    );
    if (existing.rows.length > 0) {
      return { isDuplicate: true, existingPatient: existing.rows[0], reason: `Même email: ${email}`, duplicateType: 'EMAIL' };
    }
  }

  if (phone && data.first_name && data.last_name) {
    const existing = await query(
      'SELECT id, email, first_name, last_name, phone, created_at, severity_status FROM patients WHERE first_name = $1 AND last_name = $2 AND phone = $3' + (data.excludeId ? ' AND id != $4' : ''),
      data.excludeId ? [data.first_name, data.last_name, phone, data.excludeId] : [data.first_name, data.last_name, phone]
    );
    if (existing.rows.length > 0) {
      return { isDuplicate: true, existingPatient: existing.rows[0], reason: `Même nom (${data.first_name} ${data.last_name}) et téléphone (${phone})`, duplicateType: 'NAME_PHONE' };
    }
  }

  return { isDuplicate: false, duplicateType: 'NONE' };
}

patientsRouter.get('/', authenticateToken, requirePermission('patients'), async (req, res) => {
    try {
        const { consultationDate } = req.query;
        let sql = 'SELECT DISTINCT p.* FROM patients p';
        const params: any[] = [];
        if (consultationDate) {
            sql += ' JOIN consultations c ON c.patient_id = p.id WHERE c.date = $1';
            params.push(consultationDate);
        }
        sql += ' ORDER BY p.created_at DESC';
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.post('/', authenticateToken, requirePermission('patients', 'write'), async (req, res) => {
    let { first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, pathology, severity_status } = req.body;
    const id = `P${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;

    if (email) {
      email = normalizeEmail(email);
      if (!validateEmail(email)) return res.status(400).json({ message: 'Format d\'email invalide' });
    }
    if (phone) {
      phone = normalizePhone(phone);
      if (!validatePhone(phone)) return res.status(400).json({ message: 'Format de numéro de téléphone invalide' });
    }
    if (country && !validateCountry(country)) {
      return res.status(400).json({ message: 'Pays non reconnu' });
    }

    const dupCheck = await checkDuplicatePatient({ email, first_name, last_name, phone });
    if (dupCheck.isDuplicate) {
      return res.status(409).json({
        message: dupCheck.duplicateType === 'EMAIL' ? 'Cet email est déjà utilisé' : 'Un patient avec le même nom et téléphone existe déjà',
        duplicateType: dupCheck.duplicateType,
        existingPatient: dupCheck.existingPatient
      });
    }

    try {
        await query(
            'INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, pathology, severity_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [id, first_name, last_name, date_of_birth, gender || 'M', blood_type, phone, email, address, pathology, severity_status || 'stable']
        );
        const user = (req as any).user;
        createNotification({
            type: 'patient_created',
            title: 'Nouveau patient créé',
            message: `${first_name} ${last_name} a été ajouté(e)`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: id,
        });
        res.status(201).json({ id, message: 'Patient created' });
    } catch (err: any) {
        console.error(err);
        if (err?.code === '23505') {
            const detail = err.detail || '';
            if (detail.includes('email')) return res.status(409).json({ message: 'Cet email est déjà utilisé' });
            if (detail.includes('phone')) return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
            return res.status(409).json({ message: 'Donnée en conflit' });
        }
        res.status(500).json({ message: 'Server error', error: (err as Error).message });
    }
});

patientsRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const user = (req as any).user;
        if (user.role === 'patient' && user.patientId !== req.params.id) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        if (user.role !== 'patient') {
            const permResult = await query(
                `SELECT can_view_patients FROM secretaire_permissions WHERE user_id = $1`,
                [user.id]
            );
            const allowed = permResult.rows[0]?.can_view_patients;
            if (user.role === 'secretaire' && !allowed) {
                return res.status(403).json({ error: 'Permission denied' });
            }
        }
        const patientResult = await query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        
        const [vitalsResult, consultationsResult, documentsResult, prescriptionsResult] = await Promise.all([
            query('SELECT * FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 100', [req.params.id]),
            query('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.id]),
            query('SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.id]),
            query('SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC', [req.params.id])
        ]);
        
        res.json({
            patient: patientResult.rows[0],
            vitals: vitalsResult.rows,
            consultations: consultationsResult.rows,
            documents: documentsResult.rows,
            prescriptions: prescriptionsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.put('/:id/self', authenticateToken, async (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'patient' || user.patientId !== req.params.id) {
        return res.status(403).json({ message: 'Accès refusé' });
    }
    let { phone, email, address, emergency_contact, allergies, medical_history } = req.body;

    if (email) {
      email = normalizeEmail(email);
      if (!validateEmail(email)) return res.status(400).json({ message: 'Format d\'email invalide' });
    }
    if (phone) {
      phone = normalizePhone(phone);
      if (!validatePhone(phone)) return res.status(400).json({ message: 'Format de numéro de téléphone invalide' });
    }

    try {
        await query(
            'UPDATE patients SET phone=$1, email=$2, address=$3, emergency_contact=$4, allergies=$5, medical_history=$6 WHERE id=$7',
            [phone, email, address, emergency_contact, allergies ? JSON.stringify(allergies) : null, medical_history ? JSON.stringify(medical_history) : null, req.params.id]
        );
        res.json({ message: 'Profil mis à jour' });
    } catch (err: any) {
        if (err?.code === '23505') {
            const detail = err.detail || '';
            if (detail.includes('email')) return res.status(409).json({ message: 'Cet email est déjà utilisé' });
            if (detail.includes('phone')) return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
            return res.status(409).json({ message: 'Donnée en conflit' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.put('/:id', authenticateToken, requirePermission('patients', 'write'), async (req, res) => {
    let { first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status } = req.body;

    if (email) {
      email = normalizeEmail(email);
      if (!validateEmail(email)) return res.status(400).json({ message: 'Format d\'email invalide' });
    }
    if (phone) {
      phone = normalizePhone(phone);
      if (!validatePhone(phone)) return res.status(400).json({ message: 'Format de numéro de téléphone invalide' });
    }
    if (country && !validateCountry(country)) {
      return res.status(400).json({ message: 'Pays non reconnu' });
    }

    const dupCheck = await checkDuplicatePatient({ email, first_name, last_name, phone, excludeId: req.params.id });
    if (dupCheck.isDuplicate) {
      return res.status(409).json({
        message: dupCheck.duplicateType === 'EMAIL' ? 'Cet email est déjà utilisé' : 'Un patient avec le même nom et téléphone existe déjà',
        duplicateType: dupCheck.duplicateType,
        existingPatient: dupCheck.existingPatient
      });
    }

    try {
        await query(
            'UPDATE patients SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, blood_type=$5, phone=$6, email=$7, address=$8, country=$9, emergency_contact=$10, allergies=$11, medical_history=$12, pathology=$13, severity_status=$14 WHERE id=$15',
            [first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, pathology, severity_status, req.params.id]
        );
        res.json({ message: 'Patient updated' });
    } catch (err: any) {
        if (err?.code === '23505') {
            const detail = err.detail || '';
            if (detail.includes('email')) return res.status(409).json({ message: 'Cet email est déjà utilisé' });
            if (detail.includes('phone')) return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
            return res.status(409).json({ message: 'Donnée en conflit' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.delete('/:id', authenticateToken, requirePermission('patients', 'delete'), async (req, res) => {
    try {
        const result = await query('DELETE FROM patients WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        res.json({ message: 'Patient deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.put('/:id/consultations/:consultationId', authenticateToken, requirePermission('consultations', 'write'), async (req, res) => {
    const { motif, ecole, examen, diagnostic, traitement, note, date } = req.body;
    try {
        await query(
            'UPDATE consultations SET date=$1, motif=$2, ecole=$3, examen=$4, diagnostic=$5, traitement=$6, note=$7 WHERE id=$8 AND patient_id=$9',
            [date, motif, ecole, examen, diagnostic, traitement, note, req.params.consultationId, req.params.id]
        );
        res.json({ message: 'Consultation updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.post('/:id/consultations', authenticateToken, requirePermission('consultations', 'write'), async (req, res) => {
    const { motif, ecole, examen, diagnostic, traitement, note, date } = req.body;
    const id = `c${Date.now().toString(36)}`;
    try {
        await query(
            'INSERT INTO consultations (id, patient_id, date, motif, ecole, examen, diagnostic, traitement, note, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, req.params.id, date || new Date().toISOString().split('T')[0], motif, ecole, examen, diagnostic, traitement, note, "Dr. Étienne Tremblay"]
        );
        const user = (req as any).user;
        const patient = await query('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.id]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.id;
        createNotification({
            type: 'consultation_added',
            title: 'Consultation ajoutée',
            message: `Nouvelle consultation pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.id,
            related_id: id,
        });
        res.status(201).json({ message: 'Consultation added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.post('/:id/vitals', authenticateToken, requirePermission('vitals', 'write'), async (req, res) => {
    const { systolic, diastolic, heart_rate, weight, sp02, note } = req.body;
    const id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await query(
            'INSERT INTO vital_entries (id, patient_id, systolic, diastolic, heart_rate, weight, sp02, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, req.params.id, systolic, diastolic, heart_rate, weight, sp02, note]
        );
        const user = (req as any).user;
        const patient = await query('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.id]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.id;
        createNotification({
            type: 'vitals_added',
            title: 'Signes vitaux enregistrés',
            message: `Nouveaux signes vitaux pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.id,
            related_id: id,
        });
        res.status(201).json({ message: 'Vital entry added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


