import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import { authRouter } from "./routes/auth.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { chatRouter } from "./routes/chat.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { patientsRouter } from "./routes/patients.js";
import { prescriptionsRouter } from "./routes/prescriptions.js";
import { settingsRouter } from "./routes/settings.js";
import { ensureUploadDir } from "./utils/uploads.js";
const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? envFile });
ensureUploadDir();
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    credentials: true
}));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/prescriptions", prescriptionsRouter);
app.use("/api/settings", settingsRouter);
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
});
