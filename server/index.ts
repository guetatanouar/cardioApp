import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { patientsRouter } from './routes/patients.js';
import { appointmentsRouter } from './routes/appointments.js';
import { vitalsRouter } from './routes/vitals.js';
import { chatRouter } from './routes/chat.js';
import { prescriptionsRouter } from './routes/prescriptions.js';
import { consultationsRouter } from './routes/consultations.js';
import { documentsRouter } from './routes/documents.js';
import { settingsRouter } from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
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
app.use('/api/settings', settingsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
