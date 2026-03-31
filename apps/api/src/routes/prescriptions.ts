import { Router } from "express";
import { z } from "zod";

import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensurePatientOrStaff } from "../middleware/access.js";
import { hasSecretairePermission, requirePermission } from "../middleware/permissions.js";

export const prescriptionsRouter = Router();

prescriptionsRouter.get("/", requireAuth, async (req, res) => {
  const patientId = typeof req.query.patientId === "string" ? req.query.patientId : undefined;
  if (!patientId) return res.status(400).json({ error: "MISSING_patientId" });

  if (!ensurePatientOrStaff(req, res, patientId)) return;

  if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
  if (req.user.role === "secretaire") {
    const ok = await hasSecretairePermission(req.user.id, "can_view_prescriptions");
    if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
  }

  const result = await query(
    `SELECT id, patient_id, created_at, general_notes, items
     FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [patientId]
  );

  res.json({ items: result.rows });
});

prescriptionsRouter.post(
  "/",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_edit_prescriptions"),
  async (req, res) => {
  const itemSchema = z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional()
  });

  const bodySchema = z.object({
    patientId: z.string().uuid(),
    generalNotes: z.string().optional(),
    items: z.array(itemSchema).min(1)
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

  const b = parsed.data;
  const result = await query<{ id: string }>(
    `INSERT INTO prescriptions (patient_id, general_notes, items)
     VALUES ($1,$2,$3)
     RETURNING id`,
    [b.patientId, b.generalNotes ?? null, JSON.stringify(b.items)]
  );

  res.status(201).json({ id: result.rows[0]?.id });
  }
);
