import { Router } from "express";
import { z } from "zod";

import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { hasSecretairePermission } from "../middleware/permissions.js";

export const chatRouter = Router();

function canAccessChannel(user: { id: string; role: string }, channel: string) {
  if (channel === "staff") {
    return user.role !== "patient";
  }

  if (channel.startsWith("patient:")) {
    const pid = channel.slice("patient:".length);
    if (user.role === "patient") return user.id === pid;
    return true;
  }

  return false;
}

chatRouter.get("/", requireAuth, async (req, res) => {
  const channel = typeof req.query.channel === "string" ? req.query.channel : "staff";
  const since = typeof req.query.since === "string" ? req.query.since : undefined;

  if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
  if (req.user.role === "secretaire") {
    const ok = await hasSecretairePermission(req.user.id, "can_view_chat");
    if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (!canAccessChannel(req.user, channel)) return res.status(403).json({ error: "FORBIDDEN" });

  const params: any[] = [channel];
  let where = "WHERE channel = $1";

  if (since) {
    params.push(since);
    where += ` AND created_at > $${params.length}`;
  }

  const result = await query(
    `SELECT id, channel, sender_role, sender_id, patient_id, content, created_at, is_read
     FROM chat_messages ${where}
     ORDER BY created_at ASC LIMIT 200`,
    params
  );

  res.json({ items: result.rows });
});

chatRouter.post("/", requireAuth, async (req, res) => {
  const bodySchema = z.object({
    channel: z.string().min(1),
    content: z.string().min(1)
  });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

  if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
  if (req.user.role === "secretaire") {
    const ok = await hasSecretairePermission(req.user.id, "can_view_chat");
    if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (!canAccessChannel(req.user, parsed.data.channel)) return res.status(403).json({ error: "FORBIDDEN" });

  const patientId = parsed.data.channel.startsWith("patient:")
    ? parsed.data.channel.slice("patient:".length)
    : null;

  const result = await query<{ id: string }>(
    `INSERT INTO chat_messages (channel, sender_role, sender_id, patient_id, content, is_read)
     VALUES ($1,$2,$3,$4,$5,false)
     RETURNING id`,
    [parsed.data.channel, req.user.role, req.user.id, patientId, parsed.data.content]
  );

  res.status(201).json({ id: result.rows[0]?.id });
});

chatRouter.post("/mark-read", requireAuth, async (req, res) => {
  const bodySchema = z.object({ channel: z.string().min(1) });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

  if (!req.user) return res.status(401).json({ error: "UNAUTHENTICATED" });
  if (!canAccessChannel(req.user, parsed.data.channel)) return res.status(403).json({ error: "FORBIDDEN" });

  await query(`UPDATE chat_messages SET is_read = true WHERE channel = $1`, [parsed.data.channel]);
  res.json({ ok: true });
});
