import { Router, type Request, type Response } from "express";

import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

export const dashboardRouter = Router();

function startOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

dashboardRouter.get(
  "/summary",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_view_patients"),
  async (_req: Request, res: Response) => {
    const today = new Date();
    const from = startOfDayISO(today);
    const to = endOfDayISO(today);

    const [patientsCount, todayAppointments, unreadStaffMessages, criticalAlerts, recentActivity] = await Promise.all([
      query<{ count: number }>("SELECT count(*)::int as count FROM patients"),
      query(
        `SELECT a.id, a.starts_at, a.duration_minutes, a.type, a.status, a.reason, a.notes,
                p.id as patient_id, p.first_name, p.last_name, p.severity_status
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         WHERE a.starts_at >= $1 AND a.starts_at <= $2
         ORDER BY a.starts_at ASC
         LIMIT 200`,
        [from, to]
      ),
      query<{ count: number }>(
        "SELECT count(*)::int as count FROM chat_messages WHERE channel = 'staff' AND is_read = false"
      ),
      query(
        `SELECT p.id as patient_id, p.first_name, p.last_name, p.severity_status,
                v.recorded_at, v.spo2, v.heart_rate
         FROM patients p
         JOIN LATERAL (
           SELECT recorded_at, spo2, heart_rate
           FROM vital_entries
           WHERE patient_id = p.id
           ORDER BY recorded_at DESC
           LIMIT 1
         ) v ON true
         WHERE (v.spo2 IS NOT NULL AND v.spo2 < 95)
            OR (v.heart_rate IS NOT NULL AND v.heart_rate > 100)
         ORDER BY v.recorded_at DESC
         LIMIT 50`
      ),
      query(
        `SELECT * FROM (
           SELECT c.id, c.created_at as event_at, 'consultation'::text as event_type,
                  p.id as patient_id, p.first_name, p.last_name,
                  COALESCE(c.reason, '') as label
           FROM consultations c
           JOIN patients p ON p.id = c.patient_id
           UNION ALL
           SELECT d.id, d.created_at as event_at, 'document'::text as event_type,
                  p.id as patient_id, p.first_name, p.last_name,
                  COALESCE(d.category, '') as label
           FROM documents d
           JOIN patients p ON p.id = d.patient_id
         ) x
         ORDER BY x.event_at DESC
         LIMIT 20`
      )
    ]);

    const appointmentsRows = todayAppointments.rows as Array<{ status: string }>;
    const appointmentsUrgent = appointmentsRows.filter((x) => x.status === "urgent").length;
    const appointmentsPlanned = appointmentsRows.filter((x) => x.status === "planifie").length;
    const appointmentsCompleted = appointmentsRows.filter((x) => x.status === "complete").length;

    res.json({
      patientsTotal: patientsCount.rows[0]?.count ?? 0,
      appointmentsToday: todayAppointments.rows,
      appointmentsCountToday: appointmentsRows.length,
      appointmentsUrgent,
      appointmentsPlanned,
      appointmentsCompleted,
      unreadStaffMessages: unreadStaffMessages.rows[0]?.count ?? 0,
      criticalAlerts: criticalAlerts.rows,
      recentActivity: recentActivity.rows
    });
  }
);
