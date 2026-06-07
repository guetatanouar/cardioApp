import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const consultationsRouter = Router();

consultationsRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY date DESC', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

consultationsRouter.post('/:id', authenticateToken, async (req, res) => {
    const { motif, examen, diagnostic, traitement, note } = req.body;
    const id = `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await query(
            'INSERT INTO consultations (id, patient_id, date, motif, examen, diagnostic, traitement, note, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, req.params.id, new Date().toISOString().split('T')[0], motif, examen, diagnostic, traitement, note, "Dr. Étienne Tremblay"]
        );
        res.status(201).json({ message: 'Consultation added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
