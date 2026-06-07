"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentsRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
const createNotification_js_1 = require("../lib/createNotification.js");
const upload = (0, multer_1.default)({ dest: 'uploads/' });
exports.documentsRouter = (0, express_1.Router)();
exports.documentsRouter.get('/:patientId', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents'), async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)('SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.patientId]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.documentsRouter.post('/:patientId', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents', 'write'), upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file)
        return res.status(400).json({ message: 'No file provided' });
    const docId = `doc_${Date.now().toString(36)}`;
    const { category } = req.body;
    try {
        await (0, pool_js_1.query)('INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES ($1, $2, $3, $4, $5, $6)', [docId, req.params.patientId, file.originalname, category || 'autre', String(file.size), file.path]);
        const user = req.user;
        const patient = await (0, pool_js_1.query)('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.patientId]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.patientId;
        (0, createNotification_js_1.createNotification)({
            type: 'document_uploaded',
            title: 'Document ajouté',
            message: `${file.originalname} ajouté pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.patientId,
            related_id: docId,
        });
        res.status(201).json({ message: 'Document uploaded' });
    }
    catch (err) {
        console.error('Document upload error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
exports.documentsRouter.delete('/:id', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents', 'write'), async (req, res) => {
    try {
        await (0, pool_js_1.query)('DELETE FROM documents WHERE id = $1', [req.params.id]);
        res.json({ message: 'Document deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
