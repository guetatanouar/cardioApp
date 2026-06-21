import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
export const vitalsRouter = Router();
vitalsRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT * FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC', [req.params.id]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
vitalsRouter.post('/:id', authenticateToken, async (req, res) => {
    const { systolic, diastolic, heart_rate, weight, sp02, note } = req.body;
    const id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await query('INSERT INTO vital_entries (id, patient_id, systolic, diastolic, heart_rate, weight, sp02, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [id, req.params.id, systolic, diastolic, heart_rate, weight, sp02, note]);
        res.status(201).json({ message: 'Vital entry added' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
