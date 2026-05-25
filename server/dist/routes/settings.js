"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.use(auth_js_1.authenticateToken);
exports.settingsRouter.get('/profile', async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)(`SELECT name as "fullName", email, role, phone, address, rpps, specialty, first_name, last_name
             FROM users WHERE id = $1`, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.settingsRouter.put('/profile', async (req, res) => {
    try {
        const { fullName, email, phone, address, rpps, specialty, firstName, lastName } = req.body;
        await (0, pool_js_1.query)(`UPDATE users SET name = $1, email = $2, phone = $3, address = $4, rpps = $5, specialty = $6, first_name = $7, last_name = $8 WHERE id = $9`, [fullName, email, phone || null, address || null, rpps || null, specialty || null, firstName || null, lastName || null, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.settingsRouter.put('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userResult = await (0, pool_js_1.query)('SELECT password FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, userResult.rows[0].password);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        await (0, pool_js_1.query)('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.settingsRouter.get('/secretaire-permissions', async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)(`
            SELECT u.id as user_id, u.name as full_name, u.email,
                COALESCE(p.can_view_patients, false) as can_view_patients,
                COALESCE(p.can_edit_patients, false) as can_edit_patients,
                COALESCE(p.can_delete_patients, false) as can_delete_patients,
                COALESCE(p.can_view_appointments, false) as can_view_appointments,
                COALESCE(p.can_edit_appointments, false) as can_edit_appointments,
                COALESCE(p.can_delete_appointments, false) as can_delete_appointments,
                COALESCE(p.can_view_chat, false) as can_view_chat,
                COALESCE(p.can_send_chat, false) as can_send_chat,
                COALESCE(p.can_view_prescriptions, false) as can_view_prescriptions,
                COALESCE(p.can_edit_prescriptions, false) as can_edit_prescriptions,
                COALESCE(p.can_view_vitals, false) as can_view_vitals,
                COALESCE(p.can_edit_vitals, false) as can_edit_vitals,
                COALESCE(p.can_view_documents, false) as can_view_documents,
                COALESCE(p.can_upload_documents, false) as can_upload_documents,
                COALESCE(p.can_view_consultations, false) as can_view_consultations
            FROM users u
            LEFT JOIN secretaire_permissions p ON u.id = p.user_id
            WHERE u.role = 'secretaire'
            ORDER BY u.name
        `);
        res.json({ items: result.rows });
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.settingsRouter.put('/secretaire-permissions/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const knownKeys = new Set([
            'can_view_patients', 'can_edit_patients', 'can_delete_patients',
            'can_view_appointments', 'can_edit_appointments', 'can_delete_appointments',
            'can_view_chat', 'can_send_chat',
            'can_view_prescriptions', 'can_edit_prescriptions',
            'can_view_vitals', 'can_edit_vitals',
            'can_view_documents', 'can_upload_documents',
            'can_view_consultations'
        ]);
        const dbKey = Object.keys(req.body).find(k => knownKeys.has(k));
        if (!dbKey) {
            return res.status(400).json({ error: 'No valid permission key provided' });
        }
        const value = req.body[dbKey];
        await (0, pool_js_1.query)(`INSERT INTO secretaire_permissions (user_id, ${dbKey}) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET ${dbKey} = $2`, [userId, value]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.settingsRouter.get('/patient-accounts/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await (0, pool_js_1.query)('SELECT id, patient_id, username, is_active, created_at FROM patient_accounts WHERE patient_id = $1', [patientId]);
        res.json({ item: result.rows[0] || null });
    }
    catch (error) {
        console.error('Error fetching patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.settingsRouter.post('/patient-accounts', async (req, res) => {
    try {
        const { patientId, username, password } = req.body;
        if (!patientId || !username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        await (0, pool_js_1.query)(`INSERT INTO patient_accounts (patient_id, username, password) VALUES ($1, $2, $3)
             ON CONFLICT (patient_id) DO UPDATE SET username = $2, password = $3, is_active = TRUE`, [patientId, username, hashed]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error creating patient account:', error);
        const detail = error?.detail || error?.message || 'Internal server error';
        res.status(500).json({ error: detail });
    }
});
exports.settingsRouter.put('/patient-accounts/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { isActive, password } = req.body;
        if (password) {
            const hashed = await bcryptjs_1.default.hash(password, 10);
            if (isActive !== undefined) {
                await (0, pool_js_1.query)('UPDATE patient_accounts SET is_active = $1, password = $2 WHERE patient_id = $3', [isActive, hashed, patientId]);
            }
            else {
                await (0, pool_js_1.query)('UPDATE patient_accounts SET password = $1 WHERE patient_id = $2', [hashed, patientId]);
            }
        }
        else {
            await (0, pool_js_1.query)('UPDATE patient_accounts SET is_active = $1 WHERE patient_id = $2', [isActive, patientId]);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
