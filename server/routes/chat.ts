import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const chatRouter = Router();

chatRouter.get('/', authenticateToken, async (req, res) => {
    const { channel, patientId } = req.query;
    try {
        let result;
        if (channel === 'staff') {
            result = await query('SELECT * FROM chat_messages WHERE channel = \'staff\' ORDER BY created_at ASC');
        } else {
            result = await query('SELECT * FROM chat_messages WHERE channel = \'patient\' AND patient_id = $1 ORDER BY created_at ASC', [patientId]);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

chatRouter.post('/', authenticateToken, async (req, res) => {
    const { id, channel, patient_id, from_name, from_role, text } = req.body;
    try {
        await query(
            'INSERT INTO chat_messages (id, channel, patient_id, from_name, from_role, text) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, channel, patient_id, from_name, from_role, text]
        );
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
