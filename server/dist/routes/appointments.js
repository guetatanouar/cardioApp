"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
exports.appointmentsRouter = (0, express_1.Router)();
exports.appointmentsRouter.get('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('appointments'), async (req, res) => {
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
        const result = await (0, pool_js_1.query)(sql, params);
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
exports.appointmentsRouter.post('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('appointments', 'write'), async (req, res) => {
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
        await (0, pool_js_1.query)('INSERT INTO appointments (id, patient_id, date, time, duration, type, status, reason, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [id, patientId, dateStr, timeStr, durationMinutes ?? 30, type, status ?? 'scheduled', reason ?? null, notes ?? null]);
        res.status(201).json({ message: 'Appointment created', id });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.appointmentsRouter.put('/:id', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('appointments', 'write'), async (req, res) => {
    const { status } = req.body;
    try {
        await (0, pool_js_1.query)('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json({ message: 'Appointment updated' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
