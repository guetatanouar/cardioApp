"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), 'server', '.env') });
// Ensure uploads directory exists
const uploadsDir = path_1.default.resolve('uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const auth_js_1 = require("./routes/auth.js");
const dashboard_js_1 = require("./routes/dashboard.js");
const patients_js_1 = require("./routes/patients.js");
const appointments_js_1 = require("./routes/appointments.js");
const vitals_js_1 = require("./routes/vitals.js");
const chat_js_1 = require("./routes/chat.js");
const prescriptions_js_1 = require("./routes/prescriptions.js");
const consultations_js_1 = require("./routes/consultations.js");
const documents_js_1 = require("./routes/documents.js");
const analyse_js_1 = require("./routes/analyse.js");
const settings_js_1 = require("./routes/settings.js");
const notifications_js_1 = require("./routes/notifications.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use('/uploads', express_1.default.static('uploads'));
app.use('/api/dashboard', dashboard_js_1.dashboardRouter);
app.use('/api/auth', auth_js_1.authRouter);
app.use('/api/patients', patients_js_1.patientsRouter);
app.use('/api/appointments', appointments_js_1.appointmentsRouter);
app.use('/api/vitals', vitals_js_1.vitalsRouter);
app.use('/api/chat', chat_js_1.chatRouter);
app.use('/api/prescriptions', prescriptions_js_1.prescriptionsRouter);
app.use('/api/consultations', consultations_js_1.consultationsRouter);
app.use('/api/documents', documents_js_1.documentsRouter);
app.use('/api/analyse', analyse_js_1.analyseRouter);
app.use('/api/settings', settings_js_1.settingsRouter);
app.use('/api/notifications', notifications_js_1.notificationsRouter);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
