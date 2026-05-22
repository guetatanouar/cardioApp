"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
exports.consultationsRouter = (0, express_1.Router)();
exports.consultationsRouter.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY date DESC', [req.params.id]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.consultationsRouter.post('/:id', auth_js_1.authenticateToken, async (req, res) => {
    const { motif, examen, diagnostic, traitement, note } = req.body;
    const id = `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await (0, pool_js_1.query)('INSERT INTO consultations (id, patient_id, date, motif, examen, diagnostic, traitement, note, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [id, req.params.id, new Date().toISOString().split('T')[0], motif, examen, diagnostic, traitement, note, "Dr. Moreau"]);
        res.status(201).json({ message: 'Consultation added' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
