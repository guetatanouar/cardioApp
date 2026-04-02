import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensurePatientOrStaff } from "../middleware/access.js";

export const vitalsRouter = Router();

// GET all vitals for a patient (duplicated from patientsRouter for cleaner separation if needed)
vitalsRouter.get("/patient/:id", requireAuth, async (req, res) => {
  const patientId = req.params.id;
  if (!ensurePatientOrStaff(req, res, patientId)) return;

  const result = await query(
    `SELECT id, recorded_at, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, note
     FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 200`,
    [patientId]
  );
  res.json({ items: result.rows });
});

// GET global vitals stats (for dashboard alerts)
vitalsRouter.get("/alerts", requireAuth, requireRole(["admin", "secretaire"]), async (req, res) => {
  const result = await query(
    `SELECT v.*, p.first_name, p.last_name
     FROM vital_entries v
     JOIN patients p ON v.patient_id = p.id
     WHERE v.spo2 < 94 OR v.heart_rate > 100 OR v.systolic_bp > 160
     ORDER BY v.recorded_at DESC LIMIT 50`
  );
  res.json({ items: result.rows });
});
