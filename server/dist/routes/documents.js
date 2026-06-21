import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';
const upload = multer({ dest: 'uploads/' });
export const documentsRouter = Router();
documentsRouter.get('/:patientId', authenticateToken, requirePermission('documents'), async (req, res) => {
    try {
        const result = await query('SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.patientId]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
documentsRouter.post('/:patientId', authenticateToken, requirePermission('documents', 'write'), upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file)
        return res.status(400).json({ message: 'No file provided' });
    const docId = `doc_${Date.now().toString(36)}`;
    const { category } = req.body;
    try {
        await query('INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES ($1, $2, $3, $4, $5, $6)', [docId, req.params.patientId, file.originalname, category || 'autre', String(file.size), file.path]);
        const user = req.user;
        const patient = await query('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.patientId]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.patientId;
        createNotification({
            type: 'document_uploaded',
            title: 'Document ajouté',
            message: `${file.originalname} ajouté pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.patientId,
            related_id: docId,
        });
        res.status(201).json({ message: 'Document uploaded' });
    }
    catch (err) {
        console.error('Document upload error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
documentsRouter.delete('/:id', authenticateToken, requirePermission('documents', 'write'), async (req, res) => {
    try {
        await query('DELETE FROM documents WHERE id = $1', [req.params.id]);
        res.json({ message: 'Document deleted' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
