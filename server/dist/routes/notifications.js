"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)(`SELECT n.*, p.first_name, p.last_name 
             FROM notifications n 
             LEFT JOIN patients p ON n.patient_id = p.id 
             ORDER BY n.created_at DESC 
             LIMIT 50`);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.notificationsRouter.get('/unread-count', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)('SELECT count(*)::int as count FROM notifications WHERE is_read = FALSE');
        res.json({ count: result.rows[0].count });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.notificationsRouter.post('/mark-read', auth_js_1.authenticateToken, async (req, res) => {
    try {
        await (0, pool_js_1.query)('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.notificationsRouter.put('/:id/read', auth_js_1.authenticateToken, async (req, res) => {
    try {
        await (0, pool_js_1.query)('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
