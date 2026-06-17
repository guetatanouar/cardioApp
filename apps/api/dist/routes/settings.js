import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hasSecretairePermission } from "../middleware/permissions.js";
export const settingsRouter = Router();
settingsRouter.get("/profile", requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    const result = await query(`SELECT id, full_name, email, username, role
     FROM users
     WHERE id = $1
     LIMIT 1`, [req.user.id]);
    const row = result.rows[0];
    if (!row)
        return res.status(404).json({ error: "NOT_FOUND" });
    return res.json({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        username: row.username,
        role: row.role
    });
});
settingsRouter.put("/profile", requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    const bodySchema = z.object({
        fullName: z.string().min(2).optional(),
        email: z.string().email().optional()
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "INVALID_BODY" });
    const fields = parsed.data;
    const keys = Object.keys(fields);
    if (keys.length === 0)
        return res.json({ ok: true });
    const mapping = {
        fullName: "full_name",
        email: "email"
    };
    const setClauses = [];
    const params = [req.user.id];
    keys.forEach((k, idx) => {
        setClauses.push(`${mapping[k]} = $${idx + 2}`);
        params.push(fields[k]);
    });
    await query(`UPDATE users SET ${setClauses.join(", ")} WHERE id = $1`, params);
    return res.json({ ok: true });
});
settingsRouter.put("/password", requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    const bodySchema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6)
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "INVALID_BODY" });
    const userResult = await query(`SELECT password_hash FROM users WHERE id = $1 LIMIT 1`, [req.user.id]);
    const user = userResult.rows[0];
    if (!user)
        return res.status(404).json({ error: "NOT_FOUND" });
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
    if (!ok)
        return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    const hash = await bcrypt.hash(parsed.data.newPassword, 10);
    await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [req.user.id, hash]);
    return res.json({ ok: true });
});
settingsRouter.get("/secretaire-permissions", requireAuth, requireRole(["admin"]), async (_req, res) => {
    const result = await query(`SELECT sp.*, u.full_name, u.email
     FROM secretaire_permissions sp
     JOIN users u ON u.id = sp.user_id
     WHERE u.role = 'secretaire'
     ORDER BY u.full_name ASC`);
    res.json({ items: result.rows });
});
settingsRouter.put("/secretaire-permissions/:userId", requireAuth, requireRole(["admin"]), async (req, res) => {
    const userId = req.params.userId;
    const bodySchema = z.object({
        canViewPatients: z.boolean().optional(),
        canEditPatients: z.boolean().optional(),
        canViewAppointments: z.boolean().optional(),
        canEditAppointments: z.boolean().optional(),
        canViewChat: z.boolean().optional(),
        canViewPrescriptions: z.boolean().optional(),
        canEditPrescriptions: z.boolean().optional()
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "INVALID_BODY" });
    const mapping = {
        canViewPatients: "can_view_patients",
        canEditPatients: "can_edit_patients",
        canViewAppointments: "can_view_appointments",
        canEditAppointments: "can_edit_appointments",
        canViewChat: "can_view_chat",
        canViewPrescriptions: "can_view_prescriptions",
        canEditPrescriptions: "can_edit_prescriptions"
    };
    const keys = Object.keys(parsed.data);
    if (keys.length === 0)
        return res.json({ ok: true });
    const setClauses = [];
    const params = [userId];
    keys.forEach((k, idx) => {
        setClauses.push(`${mapping[k]} = $${idx + 2}`);
        params.push(parsed.data[k]);
    });
    setClauses.push(`updated_at = now()`);
    await query(`UPDATE secretaire_permissions SET ${setClauses.join(", ")}
     WHERE user_id = $1`, params);
    res.json({ ok: true });
});
settingsRouter.post("/patient-accounts", requireAuth, requireRole(["admin", "secretaire"]), async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (req.user.role === "secretaire") {
        const ok = await hasSecretairePermission(req.user.id, "can_edit_patients");
        if (!ok)
            return res.status(403).json({ error: "FORBIDDEN" });
    }
    const bodySchema = z.object({
        patientId: z.string().uuid(),
        username: z.string().min(3),
        password: z.string().min(6)
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "INVALID_BODY" });
    const hash = await bcrypt.hash(parsed.data.password, 10);
    const result = await query(`INSERT INTO patient_accounts (patient_id, username, password_hash, is_active)
     VALUES ($1,$2,$3,true)
     ON CONFLICT (patient_id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash
     RETURNING id`, [parsed.data.patientId, parsed.data.username, hash]);
    res.status(201).json({ id: result.rows[0]?.id });
});
settingsRouter.get("/patient-accounts/:patientId", requireAuth, requireRole(["admin", "secretaire"]), async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (req.user.role === "secretaire") {
        const ok = await hasSecretairePermission(req.user.id, "can_edit_patients");
        if (!ok)
            return res.status(403).json({ error: "FORBIDDEN" });
    }
    const patientId = req.params.patientId;
    const result = await query(`SELECT id, patient_id, username, is_active, created_at
     FROM patient_accounts
     WHERE patient_id = $1
     LIMIT 1`, [patientId]);
    const row = result.rows[0] ?? null;
    return res.json({ item: row });
});
settingsRouter.put("/patient-accounts/:patientId", requireAuth, requireRole(["admin", "secretaire"]), async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (req.user.role === "secretaire") {
        const ok = await hasSecretairePermission(req.user.id, "can_edit_patients");
        if (!ok)
            return res.status(403).json({ error: "FORBIDDEN" });
    }
    const patientId = req.params.patientId;
    const bodySchema = z.object({
        isActive: z.boolean().optional(),
        password: z.string().min(6).optional()
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "INVALID_BODY" });
    const updates = [];
    const params = [patientId];
    if (typeof parsed.data.isActive === "boolean") {
        params.push(parsed.data.isActive);
        updates.push(`is_active = $${params.length}`);
    }
    if (parsed.data.password) {
        const hash = await bcrypt.hash(parsed.data.password, 10);
        params.push(hash);
        updates.push(`password_hash = $${params.length}`);
    }
    if (updates.length === 0)
        return res.json({ ok: true });
    await query(`UPDATE patient_accounts SET ${updates.join(", ")} WHERE patient_id = $1`, params);
    res.json({ ok: true });
});
