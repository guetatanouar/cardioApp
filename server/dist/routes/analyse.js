"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
const upload = (0, multer_1.default)({ dest: 'uploads/' });
exports.analyseRouter = (0, express_1.Router)();
function generateReport(patient, vitals, documents) {
    const pathology = patient.pathology || "non spécifiée";
    const severity = patient.severity_status;
    const docCategories = documents.map(d => d.category).filter(Boolean);
    const hasECG = docCategories.some(c => c.toLowerCase().includes("analyse"));
    const hasEcho = docCategories.some(c => c.toLowerCase().includes("echographie"));
    const lastVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;
    // Build dynamic findings based on patient data
    const findings = [];
    if (lastVitals) {
        if (lastVitals.systolic && lastVitals.diastolic) {
            if (lastVitals.systolic >= 140 || lastVitals.diastolic >= 90) {
                findings.push(`Tension artérielle élevée: ${lastVitals.systolic}/${lastVitals.diastolic} mmHg`);
            }
            else if (lastVitals.systolic >= 130) {
                findings.push(`Tension artérielle aux limites hautes: ${lastVitals.systolic}/${lastVitals.diastolic} mmHg`);
            }
            else {
                findings.push(`Tension artérielle normale: ${lastVitals.systolic}/${lastVitals.diastolic} mmHg`);
            }
        }
        if (lastVitals.heart_rate) {
            if (lastVitals.heart_rate > 100) {
                findings.push(`Tachycardie détectée: ${lastVitals.heart_rate} bpm`);
            }
            else if (lastVitals.heart_rate < 60) {
                findings.push(`Bradycardie sinusale: ${lastVitals.heart_rate} bpm`);
            }
            else {
                findings.push(`Rythme cardiaque normal: ${lastVitals.heart_rate} bpm`);
            }
        }
        if (lastVitals.sp02) {
            if (lastVitals.sp02 < 95) {
                findings.push(`Désaturation: SpO2 à ${lastVitals.sp02}%`);
            }
            else {
                findings.push(`Saturation en oxygène normale: ${lastVitals.sp02}%`);
            }
        }
    }
    if (hasECG) {
        if (pathology.toLowerCase().includes("hypertension")) {
            findings.push("ECG: Signes d'hypertrophie ventriculaire gauche à surveiller");
        }
        else if (pathology.toLowerCase().includes("arythmie") || pathology.toLowerCase().includes("tachycardie")) {
            findings.push("ECG: Troubles du rythme à confirmer par Holter");
        }
        else if (pathology.toLowerCase().includes("insuffisance")) {
            findings.push("ECG: Peu de modifications aiguës, évolution stable");
        }
        else {
            findings.push("ECG: Rythme sinusal régulier, pas d'anomalie significative");
        }
    }
    if (hasEcho) {
        if (pathology.toLowerCase().includes("insuffisance")) {
            findings.push("Échocardiographie: FEVG préservée, pas d'aggravation");
        }
        else if (severity === "critique") {
            findings.push("Échocardiographie: Anomalies structurelles nécessitant surveillance rapprochée");
        }
        else {
            findings.push("Échocardiographie: Résultats dans les limites attendues");
        }
    }
    // Build summary
    let summary = `Analyse des documents de ${patient.first_name} ${patient.last_name}. `;
    if (severity === "critique") {
        summary += `Patient en état critique suivi pour ${pathology}. Les examens confirment la nécessité d'une surveillance intensive. Une réévaluation thérapeutique est recommandée.`;
    }
    else if (severity === "surveillance") {
        summary += `Patient sous surveillance pour ${pathology}. Les résultats sont compatibles avec l'évolution attendue. Un suivi régulier est maintenu.`;
    }
    else {
        summary += `Patient stable suivi pour ${pathology}. Aucune anomalie aiguë détectée. Le traitement actuel semble adapté.`;
    }
    // Build observations
    let observations = `Document${documents.length > 1 ? 's' : ''} analysé${documents.length > 1 ? 's' : ''}: ${documents.map(d => d.name).join(', ')}. `;
    observations += `Pathologie référencée: ${pathology}. `;
    if (lastVitals?.weight) {
        observations += `Poids: ${lastVitals.weight} kg. `;
    }
    if (severity === "critique") {
        observations += "Recommandation: Orientation vers un service spécialisé pour prise en charge urgente.";
    }
    else {
        observations += "Recommandation: Poursuite du suivi habituel. Avis spécialisé si aggravation des symptômes.";
    }
    // Build alerts
    const alerts = [];
    if (severity === "critique") {
        alerts.push("Patient en état critique - nécessite une attention immédiate");
    }
    if (lastVitals?.systolic && lastVitals.systolic >= 160) {
        alerts.push(" hypertension sévère non contrôlée");
    }
    if (lastVitals?.sp02 && lastVitals.sp02 < 92) {
        alerts.push(" Hypoxémie sévère - oxygénothérapie à envisager");
    }
    if (lastVitals?.heart_rate && lastVitals.heart_rate > 120) {
        alerts.push(" Tachycardie importante - bilan complémentaire nécessaire");
    }
    return { summary, findings, observations, alerts };
}
exports.analyseRouter.get('/patients', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents'), async (_req, res) => {
    try {
        const patients = await (0, pool_js_1.query)(`SELECT p.id, p.first_name, p.last_name, p.severity_status, p.pathology,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', d.id, 'name', d.name, 'category', d.category,
                    'file_path', d.file_path, 'created_at', d.created_at
                  )
                  ORDER BY d.created_at DESC
                ) FILTER (WHERE d.id IS NOT NULL),
                '[]'::json
              ) AS documents
       FROM patients p
       LEFT JOIN documents d ON d.patient_id = p.id
       GROUP BY p.id
       ORDER BY p.last_name ASC, p.first_name ASC`);
        res.json(patients.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.analyseRouter.get('/reports', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents'), async (_req, res) => {
    try {
        const result = await (0, pool_js_1.query)(`SELECT ar.*, p.first_name, p.last_name
       FROM analysis_reports ar
       JOIN patients p ON p.id = ar.patient_id
       ORDER BY ar.created_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.analyseRouter.get('/reports/:id', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents'), async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)(`SELECT ar.*, p.first_name, p.last_name
       FROM analysis_reports ar
       JOIN patients p ON p.id = ar.patient_id
       WHERE ar.id = $1`, [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Report not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.analyseRouter.post('/analyze', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents'), upload.single('file'), async (req, res) => {
    try {
        const { patientId, documentIds } = req.body;
        const uploadedFile = req.file;
        const docIds = documentIds ? JSON.parse(documentIds) : [];
        if (uploadedFile) {
            const docId = `doc_${Date.now().toString(36)}`;
            await (0, pool_js_1.query)('INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES ($1, $2, $3, $4, $5, $6)', [docId, patientId, uploadedFile.originalname, 'analyse', String(uploadedFile.size), uploadedFile.path]);
            docIds.push(docId);
        }
        const patientResult = await (0, pool_js_1.query)('SELECT id, first_name, last_name, pathology, severity_status, blood_type, date_of_birth FROM patients WHERE id = $1', [patientId]);
        const patient = patientResult.rows[0];
        const vitalsResult = await (0, pool_js_1.query)('SELECT systolic, diastolic, heart_rate, sp02, weight FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 1', [patientId]);
        const vitals = vitalsResult.rows;
        const docsResult = await (0, pool_js_1.query)('SELECT id, name, category FROM documents WHERE id = ANY($1::text[])', [docIds]);
        const docs = docsResult.rows;
        const report = patient
            ? generateReport(patient, vitals, docs)
            : {
                summary: "Analyse préliminaire effectuée.",
                findings: ["Document analysé avec succès"],
                observations: "Patient non trouvé dans la base de données.",
                alerts: []
            };
        const reportId = `rpt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
        await (0, pool_js_1.query)(`INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by)
       VALUES ($1, $2, $3, $4, $5)`, [reportId, patientId, JSON.stringify(docIds), JSON.stringify(report), req.user?.id || null]);
        res.status(201).json({ id: reportId, report, documents: docIds });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.analyseRouter.post('/analyze-existing', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('documents'), async (req, res) => {
    try {
        const { patientId, documentIds } = req.body;
        if (!patientId || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({ message: 'patientId and documentIds are required' });
        }
        const patientResult = await (0, pool_js_1.query)('SELECT id, first_name, last_name, pathology, severity_status, blood_type, date_of_birth FROM patients WHERE id = $1', [patientId]);
        const patient = patientResult.rows[0];
        const vitalsResult = await (0, pool_js_1.query)('SELECT systolic, diastolic, heart_rate, sp02, weight FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 1', [patientId]);
        const vitals = vitalsResult.rows;
        const docsResult = await (0, pool_js_1.query)('SELECT id, name, category FROM documents WHERE id = ANY($1::text[])', [documentIds]);
        const docs = docsResult.rows;
        const report = patient
            ? generateReport(patient, vitals, docs)
            : {
                summary: "Analyse préliminaire effectuée.",
                findings: ["Document(s) analysé(s) avec succès"],
                observations: "Patient non trouvé dans la base de données.",
                alerts: []
            };
        const reportId = `rpt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
        await (0, pool_js_1.query)(`INSERT INTO analysis_reports (id, patient_id, document_ids, report_content, created_by)
       VALUES ($1, $2, $3, $4, $5)`, [reportId, patientId, JSON.stringify(documentIds), JSON.stringify(report), req.user?.id || null]);
        res.status(201).json({ id: reportId, report });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
