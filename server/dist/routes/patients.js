"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientsRouter = void 0;
const express_1 = require("express");
const pool_js_1 = require("../db/pool.js");
const auth_js_1 = require("../middleware/auth.js");
const permissions_js_1 = require("../middleware/permissions.js");
const createNotification_js_1 = require("../lib/createNotification.js");
exports.patientsRouter = (0, express_1.Router)();
exports.patientsRouter.get('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('patients'), async (req, res) => {
    try {
        const result = await (0, pool_js_1.query)('SELECT * FROM patients ORDER BY created_at DESC');
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.patientsRouter.post('/', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('patients', 'write'), async (req, res) => {
    const { first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, pathology, severity_status } = req.body;
    const id = `P${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
    try {
        await (0, pool_js_1.query)('INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, pathology, severity_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)', [id, first_name, last_name, date_of_birth, gender || 'M', blood_type, phone, email, address, country, pathology, severity_status || 'stable']);
        const user = req.user;
        (0, createNotification_js_1.createNotification)({
            type: 'patient_created',
            title: 'Nouveau patient créé',
            message: `${first_name} ${last_name} a été ajouté(e)`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: id,
        });
        res.status(201).json({ id, message: 'Patient created' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
exports.patientsRouter.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        // Patients can only access their own record
        if (user.role === 'patient' && user.patientId !== req.params.id) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        // Staff need the patients permission
        if (user.role !== 'patient') {
            const permResult = await (0, pool_js_1.query)(`SELECT can_view_patients FROM secretaire_permissions WHERE user_id = $1`, [user.id]);
            const allowed = permResult.rows[0]?.can_view_patients;
            if (user.role === 'secretaire' && !allowed) {
                return res.status(403).json({ error: 'Permission denied' });
            }
        }
        const patientResult = await (0, pool_js_1.query)('SELECT * FROM patients WHERE id = $1', [req.params.id]);
        if (patientResult.rows.length === 0)
            return res.status(404).json({ message: 'Patient not found' });
        const [vitalsResult, consultationsResult, documentsResult, prescriptionsResult] = await Promise.all([
            (0, pool_js_1.query)('SELECT * FROM vital_entries WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 100', [req.params.id]),
            (0, pool_js_1.query)('SELECT * FROM consultations WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.id]),
            (0, pool_js_1.query)('SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.id]),
            (0, pool_js_1.query)('SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC', [req.params.id])
        ]);
        res.json({
            patient: patientResult.rows[0],
            vitals: vitalsResult.rows,
            consultations: consultationsResult.rows,
            documents: documentsResult.rows,
            prescriptions: prescriptionsResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.patientsRouter.put('/:id', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('patients', 'write'), async (req, res) => {
    const { first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history } = req.body;
    try {
        await (0, pool_js_1.query)('UPDATE patients SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, blood_type=$5, phone=$6, email=$7, address=$8, country=$9, emergency_contact=$10, allergies=$11, medical_history=$12 WHERE id=$13', [first_name, last_name, date_of_birth, gender, blood_type, phone, email, address, country, emergency_contact, allergies, medical_history, req.params.id]);
        res.json({ message: 'Patient updated' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.patientsRouter.post('/:id/consultations', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('consultations', 'write'), async (req, res) => {
    const { motif, ecole, examen, diagnostic, traitement, note, date } = req.body;
    const id = `c${Date.now().toString(36)}`;
    try {
        await (0, pool_js_1.query)('INSERT INTO consultations (id, patient_id, date, motif, ecole, examen, diagnostic, traitement, note, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [id, req.params.id, date || new Date().toISOString().split('T')[0], motif, ecole, examen, diagnostic, traitement, note, "Dr. Moreau"]);
        const user = req.user;
        const patient = await (0, pool_js_1.query)('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.id]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.id;
        (0, createNotification_js_1.createNotification)({
            type: 'consultation_added',
            title: 'Consultation ajoutée',
            message: `Nouvelle consultation pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.id,
            related_id: id,
        });
        res.status(201).json({ message: 'Consultation added' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.patientsRouter.post('/:id/vitals', auth_js_1.authenticateToken, (0, permissions_js_1.requirePermission)('vitals', 'write'), async (req, res) => {
    const { systolic, diastolic, heart_rate, weight, sp02, note } = req.body;
    const id = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        await (0, pool_js_1.query)('INSERT INTO vital_entries (id, patient_id, systolic, diastolic, heart_rate, weight, sp02, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [id, req.params.id, systolic, diastolic, heart_rate, weight, sp02, note]);
        const user = req.user;
        const patient = await (0, pool_js_1.query)('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.id]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.id;
        (0, createNotification_js_1.createNotification)({
            type: 'vitals_added',
            title: 'Signes vitaux enregistrés',
            message: `Nouveaux signes vitaux pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.id,
            related_id: id,
        });
        res.status(201).json({ message: 'Vital entry added' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
