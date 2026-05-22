"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.get('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('chat'), async (req, res) => {
    const { channel } = req.query;
    try {
        let result;
        if (channel === 'staff') {
            result = await (0, pool_js_1.query)('SELECT * FROM chat_messages WHERE channel = \'staff\' ORDER BY created_at ASC');
        }
        else if (channel && channel.startsWith('patient:')) {
            const patientId = channel.replace('patient:', '');
            result = await (0, pool_js_1.query)('SELECT * FROM chat_messages WHERE channel = \'patient\' AND patient_id = $1 ORDER BY created_at ASC', [patientId]);
        }
        else {
            result = await (0, pool_js_1.query)('SELECT * FROM chat_messages ORDER BY created_at ASC');
        }
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.chatRouter.post('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('chat', 'send'), async (req, res) => {
    const { channel, content } = req.body;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let patient_id = null;
    let from_role = 'admin';
    let from_name = 'Dr. Moreau';
    let actualChannel = 'staff';
    if (channel && channel.startsWith('patient:')) {
        patient_id = channel.replace('patient:', '');
        from_role = 'staff';
        from_name = 'Dr. Moreau';
        actualChannel = 'patient';
    }
    try {
        await (0, pool_js_1.query)('INSERT INTO chat_messages (id, channel, patient_id, from_name, from_role, text) VALUES ($1, $2, $3, $4, $5, $6)', [id, actualChannel, patient_id, from_name, from_role, content]);
        res.status(201).json({ message: 'Message sent' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.chatRouter.post('/mark-read', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('chat'), async (req, res) => {
    const { channel } = req.body;
    try {
        let actualChannel = channel;
        if (channel && channel.startsWith('patient:')) {
            actualChannel = 'patient';
        }
        await (0, pool_js_1.query)('UPDATE chat_messages SET is_read = TRUE WHERE channel = $1 AND is_read = FALSE', [actualChannel]);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
