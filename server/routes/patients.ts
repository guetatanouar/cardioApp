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
    const { id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history } = req.body;
    try {
        await query(
            'INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, emergency_contact, allergies, medical_history]
        );
        res.status(201).json({ message: 'Patient created' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

patientsRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
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
