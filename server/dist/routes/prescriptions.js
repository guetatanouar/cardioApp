"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescriptionsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
exports.prescriptionsRouter = (0, express_1.Router)();
exports.prescriptionsRouter.get('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('prescriptions'), async (req, res) => {
    const { patientId } = req.query;
    try {
        const result = await (0, pool_js_1.query)('SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC', [patientId]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.prescriptionsRouter.post('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('prescriptions', 'write'), async (req, res) => {
    const { patientId, generalNotes, items } = req.body;
    const id = `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await (0, pool_js_1.query)('INSERT INTO prescriptions (id, patient_id, patient_name, date, doctor_name, medications, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, patientId, "Patient", new Date().toISOString().split('T')[0], "Dr. Moreau", JSON.stringify(items), generalNotes]);
        res.status(201).json({ message: 'Prescription created' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
