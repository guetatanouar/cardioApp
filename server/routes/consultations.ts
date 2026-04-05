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
    const { id, date, motif, examen, diagnostic, traitement, note, author } = req.body;
    try {
        await query(
            'INSERT INTO consultations (id, patient_id, date, motif, examen, diagnostic, traitement, note, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, req.params.id, date, motif, examen, diagnostic, traitement, note, author]
        );
        res.status(201).json({ message: 'Consultation added' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
