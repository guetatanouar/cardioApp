import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const appointmentsRouter = Router();

appointmentsRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT * FROM appointments ORDER BY date ASC, time ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

appointmentsRouter.post('/', authenticateToken, async (req, res) => {
    const { id, patient_id, date, time, duration, type, status, reason, notes } = req.body;
    try {
        await query(
            'INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, patient_id, date, time, duration, type, status, reason, notes]
        );
        res.status(201).json({ message: 'Appointment created' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

appointmentsRouter.put('/:id', authenticateToken, async (req, res) => {
    const { date, time, duration, type, status, reason, notes } = req.body;
    try {
        await query(
            'UPDATE appointments SET date=$1, time=$2, duration=$3, type=$4, status=$5, reason=$6, notes=$7 WHERE id=$8',
            [date, time, duration, type, status, reason, notes, req.params.id]
        );
        res.json({ message: 'Appointment updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
