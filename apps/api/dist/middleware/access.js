export function ensurePatientOrStaff(req, res, patientId) {
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
