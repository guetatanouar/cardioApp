import { verifyToken } from "../auth/jwt.js";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) {
        return res.status(401).json({ error: "UNAUTHENTICATED" });
    }
    try {
        const payload = verifyToken(token);
        req.user = { id: payload.sub, role: payload.role };
        return next();
    }
    catch {
        return res.status(401).json({ error: "INVALID_TOKEN" });
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "UNAUTHENTICATED" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "FORBIDDEN" });
        }
        return next();
    };
}
