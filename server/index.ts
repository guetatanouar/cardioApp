import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { patientsRouter } from './routes/patients.js';
import { appointmentsRouter } from './routes/appointments.js';
import { vitalsRouter } from './routes/vitals.js';
import { chatRouter } from './routes/chat.js';
import { prescriptionsRouter } from './routes/prescriptions.js';
import { consultationsRouter } from './routes/consultations.js';
import { documentsRouter } from './routes/documents.js';
import { analyseRouter } from './routes/analyse.js';
import { settingsRouter } from './routes/settings.js';
import { notificationsRouter } from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

app.use('/api/dashboard', dashboardRouter);
app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/vitals', vitalsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/analyse', analyseRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
