import type { Request } from "express";
import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensurePatientOrStaff } from "../middleware/access.js";
import { hasSecretairePermission, requirePermission } from "../middleware/permissions.js";
import { ensurePatientUploadDir, toPublicUploadUrl } from "../utils/uploads.js";

export const patientsRouter = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      const patientId = (req.params as any).id as string;
      const dir = ensurePatientUploadDir(patientId);
      cb(null, dir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${safeBase}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

patientsRouter.get(
  "/",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_view_patients"),
  async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize ?? 10)));
  const offset = (page - 1) * pageSize;

  const where = q
    ? "WHERE lower(last_name) LIKE lower($1) OR lower(first_name) LIKE lower($1)"
    : "";
  const params = q ? [`%${q}%`, pageSize, offset] : [pageSize, offset];

  const sql =
    `SELECT id, first_name, last_name, date_of_birth, severity_status, pathology, phone, email ` +
    `FROM patients ${where} ORDER BY last_name ASC, first_name ASC LIMIT $${q ? 2 : 1} OFFSET $${q ? 3 : 2}`;

  const result = await query(sql, params);
  const countSql = q
    ? "SELECT count(*)::int as count FROM patients WHERE lower(last_name) LIKE lower($1) OR lower(first_name) LIKE lower($1)"
    : "SELECT count(*)::int as count FROM patients";
  const countResult = await query<{ count: number }>(countSql, q ? [`%${q}%`] : []);

  res.json({
    items: result.rows,
    page,
    pageSize,
    total: countResult.rows[0]?.count ?? 0
  });
});

patientsRouter.post(
  "/",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_edit_patients"),
  async (req, res) => {
  const bodySchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().min(1),
    bloodType: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    allergies: z.string().optional(),
    medicalHistory: z.string().optional(),
    pathology: z.string().optional(),
    severityStatus: z.enum(["critique", "surveillance", "stable"]).default("stable")
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  const b = parsed.data;

  const result = await query<{ id: string }>(
    `INSERT INTO patients (
      first_name, last_name, date_of_birth, blood_type, phone, email, address,
      emergency_contact_name, emergency_contact_phone, allergies, medical_history,
      pathology, severity_status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING id`,
    [
      b.firstName,
      b.lastName,
      b.dateOfBirth,
      b.bloodType ?? null,
      b.phone ?? null,
      b.email ?? null,
      b.address ?? null,
      b.emergencyContactName ?? null,
      b.emergencyContactPhone ?? null,
      b.allergies ?? null,
      b.medicalHistory ?? null,
      b.pathology ?? null,
      b.severityStatus
    ]
  );

  return res.status(201).json({ id: result.rows[0]?.id });
});

patientsRouter.get(
  "/:id",
  requireAuth,
  async (req, res) => {
    const id = req.params.id;

    if (!ensurePatientOrStaff(req, res, id)) return;

    const patientResult = await query(
      `SELECT * FROM patients WHERE id = $1 LIMIT 1`,
      [id]
    );

    const patient = patientResult.rows[0];
    if (!patient) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    const vitals = await query(
      `SELECT id, recorded_at, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, note
       FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 50`,
      [id]
    );

    const consultations = await query(
      `SELECT id, created_at, reason, exam, diagnosis, treatment, note
       FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [id]
    );

    const documents = await query(
      `SELECT id, created_at, category, file_name, file_url
       FROM documents WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [id]
    );

    return res.json({
      patient,
      vitals: vitals.rows,
      consultations: consultations.rows,
      documents: documents.rows
    });
  }
);

patientsRouter.put(
  "/:id",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_edit_patients"),
  async (req, res) => {
    const id = req.params.id;
    const bodySchema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      dateOfBirth: z.string().min(1).optional(),
      bloodType: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      email: z.string().email().nullable().optional(),
      address: z.string().nullable().optional(),
      emergencyContactName: z.string().nullable().optional(),
      emergencyContactPhone: z.string().nullable().optional(),
      allergies: z.string().nullable().optional(),
      medicalHistory: z.string().nullable().optional(),
      pathology: z.string().nullable().optional(),
      severityStatus: z.enum(["critique", "surveillance", "stable"]).optional()
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    const fields = parsed.data;
    const keys = Object.keys(fields) as (keyof typeof fields)[];
    if (keys.length === 0) {
      return res.json({ ok: true });
    }

    const mapping: Record<string, string> = {
      firstName: "first_name",
      lastName: "last_name",
      dateOfBirth: "date_of_birth",
      bloodType: "blood_type",
      phone: "phone",
      email: "email",
      address: "address",
      emergencyContactName: "emergency_contact_name",
      emergencyContactPhone: "emergency_contact_phone",
      allergies: "allergies",
      medicalHistory: "medical_history",
      pathology: "pathology",
      severityStatus: "severity_status"
    };

    const setClauses: string[] = [];
    const params: unknown[] = [id];
    keys.forEach((k, idx) => {
      setClauses.push(`${mapping[k as keyof typeof mapping]} = $${idx + 2}`);
      params.push((fields as any)[k]);
    });

    await query(`UPDATE patients SET ${setClauses.join(", ")} WHERE id = $1`, params);
    return res.json({ ok: true });
  }
);

patientsRouter.get(
  "/:id/vitals",
  requireAuth,
  async (req, res) => {
    const patientId = req.params.id;
    if (!ensurePatientOrStaff(req, res, patientId)) return;

    const result = await query(
      `SELECT id, recorded_at, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, note
       FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 200`,
      [patientId]
    );
    res.json({ items: result.rows });
  }
);

patientsRouter.post(
  "/:id/vitals",
  requireAuth,
  async (req, res) => {
    const patientId = req.params.id;
    if (!ensurePatientOrStaff(req, res, patientId)) return;

    if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (req.user.role === "secretaire") {
      const ok = await hasSecretairePermission(req.user.id, "can_edit_patients");
      if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
    }

    const bodySchema = z.object({
      recordedAt: z.string().optional(),
      systolicBp: z.number().int().min(50).max(250).optional(),
      diastolicBp: z.number().int().min(30).max(200).optional(),
      heartRate: z.number().int().min(20).max(250).optional(),
      spo2: z.number().int().min(50).max(100).optional(),
      weightKg: z.number().min(10).max(400).optional(),
      note: z.string().optional()
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

    const b = parsed.data;
    const result = await query<{ id: string }>(
      `INSERT INTO vital_entries (patient_id, recorded_at, systolic_bp, diastolic_bp, heart_rate, spo2, weight_kg, note)
       VALUES ($1, COALESCE($2, now()), $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        patientId,
        b.recordedAt ?? null,
        b.systolicBp ?? null,
        b.diastolicBp ?? null,
        b.heartRate ?? null,
        b.spo2 ?? null,
        b.weightKg ?? null,
        b.note ?? null
      ]
    );

    res.status(201).json({ id: result.rows[0]?.id });
  }
);

patientsRouter.get(
  "/:id/consultations",
  requireAuth,
  async (req, res) => {
    const patientId = req.params.id;
    if (!ensurePatientOrStaff(req, res, patientId)) return;

    const result = await query(
      `SELECT id, created_at, reason, exam, diagnosis, treatment, note
       FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [patientId]
    );
    res.json({ items: result.rows });
  }
);

patientsRouter.post(
  "/:id/consultations",
  requireAuth,
  requireRole(["admin", "secretaire"]),
  requirePermission("can_edit_patients"),
  async (req, res) => {
    const patientId = req.params.id;

    const bodySchema = z.object({
      createdAt: z.string().optional(),
      reason: z.string().optional(),
      exam: z.string().optional(),
      diagnosis: z.string().optional(),
      treatment: z.string().optional(),
      note: z.string().optional()
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

    const b = parsed.data;
    const result = await query<{ id: string }>(
      `INSERT INTO consultations (patient_id, created_at, reason, exam, diagnosis, treatment, note)
       VALUES ($1, COALESCE($2, now()), $3, $4, $5, $6, $7)
       RETURNING id`,
      [patientId, b.createdAt ?? null, b.reason ?? null, b.exam ?? null, b.diagnosis ?? null, b.treatment ?? null, b.note ?? null]
    );

    res.status(201).json({ id: result.rows[0]?.id });
  }
);

patientsRouter.get(
  "/:id/documents",
  requireAuth,
  async (req, res) => {
    const patientId = req.params.id;
    if (!ensurePatientOrStaff(req, res, patientId)) return;

    const result = await query(
      `SELECT id, created_at, category, file_name, file_url
       FROM documents WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [patientId]
    );
    res.json({ items: result.rows });
  }
);

patientsRouter.post(
  "/:id/documents",
  requireAuth,
  requireRole(["admin", "secretaire", "patient"]),
  upload.single("file"),
  async (req, res) => {
    const patientId = req.params.id;
    if (!ensurePatientOrStaff(req, res, patientId)) return;

    if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (req.user.role === "secretaire") {
      const ok = await hasSecretairePermission(req.user.id, "can_edit_patients");
      if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
    }

    const category = typeof req.body.category === "string" ? req.body.category : "Autre";
    if (!req.file) return res.status(400).json({ error: "MISSING_FILE" });

    const publicUrl = toPublicUploadUrl(req.file.path);
    const fileName = req.file.originalname;
    const result = await query<{ id: string }>(
      `INSERT INTO documents (patient_id, category, file_name, file_url)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [patientId, category, fileName, publicUrl]
    );

    res.status(201).json({ id: result.rows[0]?.id, url: publicUrl });
  }
);

patientsRouter.delete(
  "/:id/documents/:docId",
  requireAuth,
  requireRole(["admin", "secretaire", "patient"]),
  async (req, res) => {
    const patientId = req.params.id;
    const docId = req.params.docId;
    if (!ensurePatientOrStaff(req, res, patientId)) return;

    const doc = await query<{ file_url: string }>(
      `SELECT file_url FROM documents WHERE id = $1 AND patient_id = $2 LIMIT 1`,
      [docId, patientId]
    );
    if (!doc.rows[0]) return res.status(404).json({ error: "NOT_FOUND" });

    await query(`DELETE FROM documents WHERE id = $1 AND patient_id = $2`, [docId, patientId]);

    // Best-effort delete from disk
    try {
      const url = doc.rows[0].file_url;
      const rel = url.startsWith("/uploads/") ? url.slice("/uploads/".length) : null;
      if (rel) {
        const abs = path.resolve("uploads", rel);
        await fs.unlink(abs).catch(() => undefined);
      }
    } catch {
      // ignore
    }

    res.json({ ok: true });
  }
);
