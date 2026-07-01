import { Router } from 'express';
import multer, { diskStorage } from 'multer';
import path from 'path';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';
const storage = diskStorage({
    destination: 'uploads/',
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
        cb(null, name);
    }
});
const upload = multer({ storage });
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
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const file = req.file;
    if (!file)
        return res.status(400).json({ message: 'No file provided' });
    const { category } = req.body;
    const filePath = file.path.replace(/\\/g, '/');
    const name = file.originalname;
    const size = file.size ? `${(file.size / 1024).toFixed(1)} KB` : null;
    try {
        await query('INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES ($1, $2, $3, $4, $5, $6)', [id, req.params.patientId, name, category || 'autre', size, filePath]);
        const user = req.user;
        const patient = await query('SELECT first_name, last_name FROM patients WHERE id = $1', [req.params.patientId]);
        const pName = patient.rows.length ? `${patient.rows[0].first_name} ${patient.rows[0].last_name}` : req.params.patientId;
        createNotification({
            type: 'document_uploaded',
            title: 'Document ajouté',
            message: `${name} ajouté pour ${pName}`,
            actor_name: user?.name,
            actor_role: user?.role,
            patient_id: req.params.patientId,
            related_id: id,
        });
        res.status(201).json({ message: 'Document uploaded' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
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
