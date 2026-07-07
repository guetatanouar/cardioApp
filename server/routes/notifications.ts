import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticateToken, async (req, res) => {
    try {
        const user = (req as any).user;
        let whereClause = '';
        const params: any[] = [];

        if (user.role === 'patient') {
            whereClause = 'WHERE n.patient_id = $1';
            params.push(user.patientId);
        }

        const result = await query(
            `SELECT n.*, p.first_name, p.last_name 
             FROM notifications n 
             LEFT JOIN patients p ON n.patient_id = p.id 
             ${whereClause}
             ORDER BY n.created_at DESC 
             LIMIT 50`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

notificationsRouter.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const user = (req as any).user;
        let whereClause = 'WHERE is_read = FALSE';
        const params: any[] = [];

        if (user.role === 'patient') {
            whereClause += ' AND patient_id = $1';
            params.push(user.patientId);
        }

        const result = await query(`SELECT count(*)::int as count FROM notifications ${whereClause}`, params);
        res.json({ count: result.rows[0].count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

notificationsRouter.post('/mark-read', authenticateToken, async (req, res) => {
    try {
        const user = (req as any).user;
        let whereClause = 'WHERE is_read = FALSE';
        const params: any[] = [];

        if (user.role === 'patient') {
            whereClause += ' AND patient_id = $1';
            params.push(user.patientId);
        }

        await query(`UPDATE notifications SET is_read = TRUE ${whereClause}`, params);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

notificationsRouter.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const user = (req as any).user;
        let whereClause = 'WHERE id = $1';
        const params: any[] = [req.params.id];

        if (user.role === 'patient') {
            whereClause += ' AND patient_id = $2';
            params.push(user.patientId);
        }

        await query(`UPDATE notifications SET is_read = TRUE ${whereClause}`, params);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
