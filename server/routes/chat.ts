import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const chatRouter = Router();

chatRouter.get('/', authenticateToken, async (req, res) => {
    const { channel } = req.query;
    try {
        let result;
        if (channel === 'staff') {
            result = await query('SELECT * FROM chat_messages WHERE channel = \'staff\' ORDER BY created_at ASC');
        } else if (channel && channel.startsWith('patient:')) {
            const patientId = channel.replace('patient:', '');
            result = await query('SELECT * FROM chat_messages WHERE channel = \'patient\' AND patient_id = $1 ORDER BY created_at ASC', [patientId]);
        } else {
            result = await query('SELECT * FROM chat_messages ORDER BY created_at ASC');
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

chatRouter.post('/', authenticateToken, async (req, res) => {
    const { channel, content } = req.body;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let patient_id = null;
    let from_role = 'admin';
    let from_name = 'Dr. Moreau';
    
    if (channel && channel.startsWith('patient:')) {
        patient_id = channel.replace('patient:', '');
        from_role = 'staff';
        from_name = 'Dr. Moreau';
    }
    
    try {
        await query(
            'INSERT INTO chat_messages (id, channel, patient_id, from_name, from_role, text) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, channel, patient_id, from_name, from_role, content]
        );
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

chatRouter.post('/mark-read', authenticateToken, async (req, res) => {
    const { channel } = req.body;
    try {
        await query('UPDATE chat_messages SET is_read = TRUE WHERE channel = $1 AND is_read = FALSE', [channel]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
