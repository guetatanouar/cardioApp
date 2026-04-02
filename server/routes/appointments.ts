import { Router } from "express";
import { z } from "zod";

import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

export const appointmentsRouter = Router();

appointmentsRouter.get(
  "/",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_view_appointments"),
  async (req, res) => {
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const where: string[] = [];
  const params: any[] = [];

  if (from) {
    params.push(from);
    where.push(`starts_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`starts_at <= $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }

  const sql =
    `SELECT a.*, p.first_name, p.last_name ` +
    `FROM appointments a JOIN patients p ON p.id = a.patient_id ` +
    `${where.length ? `WHERE ${where.join(" AND ")}` : ""} ` +
    `ORDER BY starts_at ASC LIMIT 500`;

  const result = await query(sql, params);
  res.json({ items: result.rows });
});

appointmentsRouter.post(
  "/",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_edit_appointments"),
  async (req, res) => {
  const bodySchema = z.object({
    patientId: z.string().uuid(),
    startsAt: z.string().min(1),
    durationMinutes: z.number().int().min(5).max(240).default(30),
    type: z.string().min(1),
    status: z.enum(["planifie", "complete", "annule", "urgent"]).default("planifie"),
    reason: z.string().optional(),
    notes: z.string().optional()
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

  const b = parsed.data;

  const result = await query<{ id: string }>(
    `INSERT INTO appointments (patient_id, starts_at, duration_minutes, type, status, reason, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [b.patientId, b.startsAt, b.durationMinutes, b.type, b.status, b.reason ?? null, b.notes ?? null]
  );

  res.status(201).json({ id: result.rows[0]?.id });
});

appointmentsRouter.put(
  "/:id",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_edit_appointments"),
  async (req, res) => {
  const id = req.params.id;

  const bodySchema = z.object({
    startsAt: z.string().min(1).optional(),
    durationMinutes: z.number().int().min(5).max(240).optional(),
    type: z.string().min(1).optional(),
    status: z.enum(["planifie", "complete", "annule", "urgent"]).optional(),
    reason: z.string().nullable().optional(),
    notes: z.string().nullable().optional()
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

  const fields = parsed.data;
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return res.json({ ok: true });

  const mapping: Record<string, string> = {
    startsAt: "starts_at",
    durationMinutes: "duration_minutes",
    type: "type",
    status: "status",
    reason: "reason",
    notes: "notes"
  };

  const setClauses: string[] = [];
  const params: unknown[] = [id];
  keys.forEach((k, idx) => {
    setClauses.push(`${mapping[k]} = $${idx + 2}`);
    params.push((fields as any)[k]);
  });

  await query(`UPDATE appointments SET ${setClauses.join(", ")} WHERE id = $1`, params);
  return res.json({ ok: true });
});
