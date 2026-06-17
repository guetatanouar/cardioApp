import fs from "node:fs";
import path from "node:path";
export const uploadDir = path.resolve("uploads");
export function ensureUploadDir() {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}
export function ensurePatientUploadDir(patientId) {
    ensureUploadDir();
    const dir = path.join(uploadDir, "patients", patientId);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
export function toPublicUploadUrl(absPath) {
    const rel = path.relative(uploadDir, absPath).split(path.sep).join("/");
    return `/uploads/${rel}`;
}
