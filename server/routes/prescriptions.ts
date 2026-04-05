import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const prescriptionsRouter = Router();

prescriptionsRouter.get('/', authenticateToken, async (req, res) => {
    const { patientId } = req.query;
    try {
        const result = await query('SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC', [patientId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

prescriptionsRouter.post('/', authenticateToken, async (req, res) => {
    const { id, patient_id, patient_name, date, doctor_name, medications, notes } = req.body;
    try {
        await query(
            'INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, patient_id, patient_name, date, doctor_name, JSON.stringify(medications), notes]
        );
        res.status(201).json({ message: 'Prescription created' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
