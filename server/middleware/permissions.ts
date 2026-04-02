import type { NextFunction, Request, Response } from "express";

import { query } from "../db.js";

export type PermissionKey =
  | "can_view_patients"
  | "can_edit_patients"
  | "can_view_appointments"
  | "can_edit_appointments"
  | "can_view_chat"
  | "can_view_prescriptions"
  | "can_edit_prescriptions";

export async function hasSecretairePermission(userId: string, key: PermissionKey) {
  const result = await query<Record<PermissionKey, boolean>>(
    `SELECT can_view_patients, can_edit_patients, can_view_appointments, can_edit_appointments, can_view_chat, can_view_prescriptions, can_edit_prescriptions
     FROM secretaire_permissions WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  return Boolean(row?.[key]);
}

export function requirePermission(key: PermissionKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });

    if (req.user.role === "admin") return next();

    if (req.user.role !== "secretaire") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const ok = await hasSecretairePermission(req.user.id, key);
    if (!ok) return res.status(403).json({ error: "FORBIDDEN" });

    return next();
  };
}
