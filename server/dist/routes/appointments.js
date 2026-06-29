import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';
export const appointmentsRouter = Router();
appointmentsRouter.get('/', authenticateToken, requirePermission('appointments'), async (req, res) => {
    try {
        const { from, to } = req.query;
        let sql = `
            SELECT a.*, p.first_name, p.last_name 
            FROM appointments a 
            LEFT JOIN patients p ON a.patient_id = p.id 
        `;
        const params = [];
        if (from && to) {
            sql += ' WHERE a.date >= $1 AND a.date <= $2';
            params.push(from, to);
        }
        else if (from) {
            sql += ' WHERE a.date >= $1';
            params.push(from);
        }
        else if (to) {
            sql += ' WHERE a.date <= $1';
            params.push(to);
        }
        sql += ' ORDER BY a.date ASC, a.time ASC';
        const result = await query(sql, params);
        const rows = result.rows.map(r => ({
            ...r,
            date: r.date instanceof Date
                ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}`
                : r.date
        }));
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
appointmentsRouter.post('/', authenticateToken, requirePermission('appointments', 'write'), async (req, res) => {
    const { patientId, startsAt, durationMinutes, type, status, reason, notes } = req.body;
    if (!patientId || !startsAt || !type) {
        return res.status(400).json({ message: 'Missing required fields: patientId, startsAt, type' });
    }
    const id = `a${Date.now().toString(36)}`;
    const date = new Date(startsAt);
    if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid startsAt date' });
    }
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    try {
        await query('INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [id, patientId, dateStr, timeStr, durationMinutes ?? 30, type, status ?? 'scheduled', reason ?? null, notes ?? null]);
        const user = req.user;
        const patient = await query('SELECT first_name, last_name FROM patients WHERE id = $1', [patientId]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : patientId;
        createNotification({
            type: 'appointment_created',
            title: 'Nouveau rendez-vous',
            message: `Rendez-vous ${type} pour ${pName} le ${dateStr} à ${timeStr}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: patientId,
            related_id: id,
        });
        res.status(201).json({ message: 'Appointment created', id });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
appointmentsRouter.put('/:id', authenticateToken, requirePermission('appointments', 'write'), async (req, res) => {
    const { status, patientId, date, time, durationMinutes, type, reason, notes } = req.body;
    try {
        if (patientId) {
            await query('UPDATE appointments SET patient_id=$1, date=$2, time=$3, duration=$4, type=$5, reason=$6, notes=$7 WHERE id=$8', [patientId, date, time, durationMinutes ?? 30, type, reason ?? null, notes ?? null, req.params.id]);
        }
        else {
            await query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
        }
        res.json({ message: 'Appointment updated' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
