"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const pool_js_1 = require("../db/pool.js");
async function createNotification(params) {
    try {
        await (0, pool_js_1.query)(`INSERT INTO notifications (type, title, message, actor_name, actor_role, patient_id, related_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [params.type, params.title, params.message || null, params.actor_name || null, params.actor_role || null, params.patient_id || null, params.related_id || null]);
    }
    catch (err) {
        console.error('Failed to create notification:', err);
    }
}
