import { Router } from 'express';
import multer from 'multer';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const upload = multer({ dest: 'uploads/' });
export const documentsRouter = Router();

documentsRouter.get('/:patientId', authenticateToken, requirePermission('documents'), async (req, res) => {
    try {
        const result = await query('SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.patientId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

documentsRouter.post('/:patientId', authenticateToken, requirePermission('documents', 'write'), upload.single('file'), async (req, res) => {
    const { id, name, category, size } = req.body;
    const filePath = req.file?.path;
    try {
        await query(
            'INSERT INTO documents (id, patient_id, name, category, size, file_path) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, req.params.patientId, name, category, size, filePath]
        );
        res.status(201).json({ message: 'Document uploaded' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

documentsRouter.delete('/:id', authenticateToken, requirePermission('documents', 'write'), async (req, res) => {
    try {
        await query('DELETE FROM documents WHERE id = $1', [req.params.id]);
        res.json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
