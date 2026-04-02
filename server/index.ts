import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "node:url";

import { vitalsRouter } from "./routes/vitals.js";
import { authRouter } from "./routes/auth.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { chatRouter } from "./routes/chat.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { patientsRouter } from "./routes/patients.js";
import { prescriptionsRouter } from "./routes/prescriptions.js";
import { settingsRouter } from "./routes/settings.js";
import { ensureUploadDir } from "./utils/uploads.js";
import { config, validateConfig } from "./config.js";

const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? envFile });

// Validate configuration
validateConfig();

ensureUploadDir();

const app = express();

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve(config.uploads.uploadDir)));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/prescriptions", prescriptionsRouter);
app.use("/api/vitals", vitalsRouter);
app.use("/api/settings", settingsRouter);

app.listen(config.server.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${config.server.port}`);
});
