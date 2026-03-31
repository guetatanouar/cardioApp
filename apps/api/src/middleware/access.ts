import type { Request, Response } from "express";

export function ensurePatientOrStaff(req: Request, res: Response, patientId: string) {
  if (!req.user) {
    res.status(401).json({ error: "UNAUTHENTICATED" });
    return false;
  }

  if (req.user.role === "patient") {
    if (req.user.id !== patientId) {
      res.status(403).json({ error: "FORBIDDEN" });
      return false;
    }
  }

  return true;
}
