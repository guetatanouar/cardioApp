"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get('/summary', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const patientsCount = await (0, pool_js_1.query)('SELECT count(*)::int as count FROM patients');
        const appointmentsToday = await (0, pool_js_1.query)(`SELECT a.*, p.first_name, p.last_name, p.severity_status 
             FROM appointments a 
             JOIN patients p ON a.patient_id = p.id 
             WHERE a.date = CURRENT_DATE 
             ORDER BY a.time ASC`);
        const appointmentsCountToday = appointmentsToday.rows.length;
        const appointmentsUrgent = await (0, pool_js_1.query)('SELECT count(*)::int as count FROM appointments WHERE date = CURRENT_DATE AND status = \'urgent\'');
        const unreadMessages = await (0, pool_js_1.query)('SELECT count(*)::int as count FROM chat_messages WHERE channel = \'staff\' AND is_read = FALSE');
        const criticalAlerts = await (0, pool_js_1.query)(`SELECT v.*, p.first_name, p.last_name, p.severity_status 
             FROM vital_entries v 
             JOIN patients p ON v.patient_id = p.id 
             WHERE v.sp02 < 94 OR v.heart_rate > 100 
             ORDER BY v.recorded_at DESC LIMIT 10`);
        const recentActivity = await (0, pool_js_1.query)(`(SELECT id, created_at as event_at, 'consultation' as event_type, patient_id, motif as label 
              FROM consultations ORDER BY created_at DESC LIMIT 5)
             UNION ALL
             (SELECT id, created_at as event_at, 'document' as event_type, patient_id, name as label 
              FROM documents ORDER BY created_at DESC LIMIT 5)
             ORDER BY event_at DESC LIMIT 10`);
        // Fetch patient names for recent activity
        const activityWithNames = await Promise.all(recentActivity.rows.map(async (act) => {
            const p = await (0, pool_js_1.query)('SELECT first_name, last_name FROM patients WHERE id = $1', [act.patient_id]);
            return { ...act, ...p.rows[0] };
        }));
        res.json({
            patientsTotal: patientsCount.rows[0].count,
            appointmentsCountToday,
            appointmentsUrgent: appointmentsUrgent.rows[0].count,
            appointmentsToday: appointmentsToday.rows.map(a => ({
                ...a,
                date: a.date instanceof Date
                    ? `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}-${String(a.date.getDate()).padStart(2, '0')}`
                    : a.date,
                starts_at: `${a.date instanceof Date
                    ? `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}-${String(a.date.getDate()).padStart(2, '0')}`
                    : a.date}T${a.time}:00`
            })),
            unreadStaffMessages: unreadMessages.rows[0].count,
            criticalAlerts: criticalAlerts.rows,
            recentActivity: activityWithNames
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
