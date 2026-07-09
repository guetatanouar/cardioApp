import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
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
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const IMAGE_MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};
app.use('/uploads', express.static('uploads', {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath);
        if (ext === '.pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            return;
        }
        if (IMAGE_EXTENSIONS.includes(ext)) {
            res.setHeader('Content-Type', IMAGE_MIME_TYPES[ext]);
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            return;
        }
        // Fallback: detect by magic bytes for extensionless files
        try {
            const fd = fs.openSync(filePath, 'r');
            const buf = Buffer.alloc(16);
            fs.readSync(fd, buf, 0, 16, 0);
            fs.closeSync(fd);
            if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
            }
            else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Content-Disposition', `inline; filename="${filename}.png"`);
            }
            else if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Content-Disposition', `inline; filename="${filename}.jpg"`);
            }
            else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
                buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
                res.setHeader('Content-Type', 'image/webp');
                res.setHeader('Content-Disposition', `inline; filename="${filename}.webp"`);
            }
        }
        catch {
            // ignore – fall back to default Content-Type
        }
    }
}));
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
