"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pool_js_1 = require("../db/pool.js");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await (0, pool_js_1.query)('SELECT id, username, email, full_name as name, role, password_hash as password FROM users WHERE username = $1 OR email = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
        let permissions = null;
        if (user.role === 'secretaire') {
            const permResult = await (0, pool_js_1.query)('SELECT * FROM secretaire_permissions WHERE user_id = $1', [user.id]);
            permissions = permResult.rows[0] || null;
        }
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.name,
                email: user.email,
                permissions
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.authRouter.post('/patient-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await (0, pool_js_1.query)('SELECT *, password_hash as password FROM patient_accounts WHERE username = $1 AND is_active IS NOT FALSE', [username]);
        const account = result.rows[0];
        if (!account || !(await bcryptjs_1.default.compare(password, account.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const patientResult = await (0, pool_js_1.query)('SELECT * FROM patients WHERE id = $1', [account.patient_id]);
        const patient = patientResult.rows[0];
        const token = jsonwebtoken_1.default.sign({ id: account.id, username: account.username, role: 'patient', patientId: patient.id, name: `${patient.first_name} ${patient.last_name}` }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, patientId: patient.id, user: { id: account.id, username: account.username, role: 'patient', patientId: patient.id, name: `${patient.first_name} ${patient.last_name}` } });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
