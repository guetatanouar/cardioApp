"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
const createNotification_js_1 = require("../lib/createNotification.js");
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.get('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('chat'), async (req, res) => {
    const { channel } = req.query;
    try {
        let result;
        if (channel === 'staff') {
            result = await (0, pool_js_1.query)('SELECT * FROM chat_messages WHERE channel = \'staff\' ORDER BY created_at ASC');
        }
        else if (typeof channel === 'string' && channel.startsWith('patient:')) {
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
    const user = req.user;
    let patient_id = undefined;
    let sender_role = user.role;
    let sender_id = user.id;
    let actualChannel = 'staff';
    if (typeof channel === 'string' && channel.startsWith('patient:')) {
        patient_id = channel.replace('patient:', '');
        sender_role = user.role === 'patient' ? 'patient' : 'staff';
        sender_id = user.id;
        actualChannel = 'patient';
    }
    try {
        await (0, pool_js_1.query)('INSERT INTO chat_messages (id, channel, sender_role, sender_id, patient_id, content) VALUES ($1, $2, $3, $4, $5, $6)', [id, actualChannel, sender_role, sender_id, patient_id, content]);
        if (actualChannel === 'staff' && sender_role !== 'admin') {
            (0, createNotification_js_1.createNotification)({
                type: 'chat_message',
                title: 'Nouveau message',
                message: `Message de ${user.name}: ${content.substring(0, 100)}`,
                actor_name: user.name,
                actor_role: sender_role,
                related_id: id,
            });
        }
        if (actualChannel === 'patient' && sender_role === 'patient') {
            (0, createNotification_js_1.createNotification)({
                type: 'chat_message',
                title: 'Nouveau message patient',
                message: `Message de ${user.name}: ${content.substring(0, 100)}`,
                actor_name: user.name,
                actor_role: sender_role,
                patient_id: patient_id,
                related_id: id,
            });
        }
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
        if (typeof channel === 'string' && channel.startsWith('patient:')) {
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
