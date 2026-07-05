import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';

export const prescriptionsRouter = Router();

prescriptionsRouter.get('/', authenticateToken, requirePermission('prescriptions'), async (req, res) => {
    const { patientId } = req.query;
    try {
        const result = await query('SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC', [patientId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

prescriptionsRouter.post('/', authenticateToken, requirePermission('prescriptions', 'write'), async (req, res) => {
    const { patientId, generalNotes, date, items } = req.body;
    const id = `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await query(
            'INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, patientId, "Patient", date || new Date().toISOString().split('T')[0], (req as any).user?.name || 'Dr.', JSON.stringify(items), generalNotes]
        );
        const user = (req as any).user;
        const patient = await query('SELECT first_name, last_name FROM patients WHERE id = $1', [patientId]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : patientId;
        createNotification({
            type: 'prescription_created',
            title: 'Ordonnance créée',
            message: `Nouvelle ordonnance pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: patientId,
            related_id: id,
        });
        res.status(201).json({ message: 'Prescription created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
