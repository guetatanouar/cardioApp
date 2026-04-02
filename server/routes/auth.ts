import { Router } from "express";
import { z } from "zod";

import { query } from "../db.js";
import { signToken } from "../auth/jwt.js";
import { verifyPassword } from "../auth/password.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const bodySchema = z.object({
    login: z.string().min(1),
    password: z.string().min(1)
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  const { login, password } = parsed.data;

  const result = await query<{
    id: string;
    email: string;
    username: string | null;
    password_hash: string;
    role: "admin" | "secretaire";
    full_name: string;
  }>(
    "SELECT id, email, username, password_hash, role, full_name FROM users WHERE (email = $1 OR username = $1) AND is_active = true LIMIT 1",
    [login]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const token = signToken({ sub: user.id, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    }
  });
});

authRouter.post("/patient-login", async (req, res) => {
  const bodySchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  const { username, password } = parsed.data;

  const result = await query<{
    id: string;
    patient_id: string;
    username: string;
    password_hash: string;
    is_active: boolean;
  }>(
    "SELECT id, patient_id, username, password_hash, is_active FROM patient_accounts WHERE username = $1 LIMIT 1",
    [username]
  );

  const acct = result.rows[0];
  if (!acct || !acct.is_active) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const ok = await verifyPassword(password, acct.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const token = signToken({ sub: acct.patient_id, role: "patient" });
  return res.json({ token, patientId: acct.patient_id });
});
