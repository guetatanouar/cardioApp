import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const patientsRouter = Router();

patientsRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT * FROM patients ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.post('/', authenticateToken, async (req, res) => {
    const { first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, pathology, severity_status } = req.body;
    const id = `P${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
    try {
        await query(
            'INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, pathology, severity_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [id, first_name, last_name, date_of_birth, gender || 'M', blood_type, phone, email, address, pathology, severity_status || 'stable']
        );
        res.status(201).json({ id, message: 'Patient created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: (err as Error).message });
    }
});

patientsRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const patientResult = await query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        
        const [vitalsResult, consultationsResult, documentsResult] = await Promise.all([
            query('SELECT * FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 100', [req.params.id]),
            query('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.id]),
            query('SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.id])
        ]);
        
        res.json({
            patient: patientResult.rows[0],
            vitals: vitalsResult.rows,
            consultations: consultationsResult.rows,
            documents: documentsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.put('/:id', authenticateToken, async (req, res) => {
    const { first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history } = req.body;
    try {
        await query(
            'UPDATE patients SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, blood_type=$5, phone=$6, email=$7, address=$8, emergency_contact=$9, allergies=$10, medical_history=$11 WHERE id=$12',
            [first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history, req.params.id]
        );
        res.json({ message: 'Patient updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.post('/:id/consultations', authenticateToken, async (req, res) => {
    const { motif, examen, diagnostic, traitement, note } = req.body;
    const id = `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await query(
            'INSERT INTO consultations (id, patient_id, date, motif, examen, diagnostic, traitement, note, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, req.params.id, new Date().toISOString().split('T')[0], motif, examen, diagnostic, traitement, note, "Dr. Moreau"]
        );
        res.status(201).json({ message: 'Consultation added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.post('/:id/vitals', authenticateToken, async (req, res) => {
    const { systolic, diastolic, heart_rate, weight, sp02, note } = req.body;
    const id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await query(
            'INSERT INTO vital_entries (id, patient_id, systolic, diastolic, heart_rate, weight, sp02, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, req.params.id, systolic, diastolic, heart_rate, weight, sp02, note]
        );
        res.status(201).json({ message: 'Vital entry added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
