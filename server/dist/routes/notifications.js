import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
export const notificationsRouter = Router();
notificationsRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await query(`SELECT n.*, p.first_name, p.last_name 
             FROM notifications n 
             LEFT JOIN patients p ON n.patient_id = p.id 
             ORDER BY n.created_at DESC 
             LIMIT 50`);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
notificationsRouter.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT count(*)::int as count FROM notifications WHERE is_read = FALSE');
        res.json({ count: result.rows[0].count });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
notificationsRouter.post('/mark-read', authenticateToken, async (req, res) => {
    try {
        await query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
notificationsRouter.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        await query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
