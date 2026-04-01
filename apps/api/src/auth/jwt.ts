import jwt from "jsonwebtoken";

export type UserRole = "admin" | "secretaire" | "patient";

export type JwtPayload = {
  sub: string;
  role: UserRole;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? "";
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }
  return secret;
}

function isValidPayload(value: unknown): value is JwtPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.sub === "string" &&
    (payload.role === "admin" || payload.role === "secretaire" || payload.role === "patient")
  );
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const decoded = jwt.verify(token, getJwtSecret());
  if (!isValidPayload(decoded)) {
    throw new Error("Invalid token payload");
  }
  return decoded;
}
