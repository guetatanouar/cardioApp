import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const appointmentsRouter = Router();

appointmentsRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT a.*, p.first_name, p.last_name 
            FROM appointments a 
            LEFT JOIN patients p ON a.patient_id = p.id 
            ORDER BY a.date ASC, a.time ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

appointmentsRouter.post('/', authenticateToken, async (req, res) => {
    const { patientId, startsAt, durationMinutes, type, status, reason, notes } = req.body;
    const id = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const date = new Date(startsAt);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    try {
        await query(
            'INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, patientId, dateStr, timeStr, durationMinutes, type, status, reason, notes]
        );
        res.status(201).json({ message: 'Appointment created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

appointmentsRouter.put('/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        await query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json({ message: 'Appointment updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
