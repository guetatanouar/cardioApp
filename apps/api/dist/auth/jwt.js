import jwt from "jsonwebtoken";
function getJwtSecret() {
    const secret = process.env.JWT_SECRET ?? "";
    if (!secret) {
        throw new Error("Missing JWT_SECRET");
    }
    return secret;
}
function isValidPayload(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const payload = value;
    return (typeof payload.sub === "string" &&
        (payload.role === "admin" || payload.role === "secretaire" || payload.role === "patient"));
}
export function signToken(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}
export function verifyToken(token) {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!isValidPayload(decoded)) {
        throw new Error("Invalid token payload");
    }
    return decoded;
}
