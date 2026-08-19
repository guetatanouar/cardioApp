import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';
export const documentTemplatesRouter = Router();
documentTemplatesRouter.get('/', authenticateToken, async (req, res) => {
    const { category } = req.query;
    try {
        let sql = 'SELECT dt.*, u.full_name as author_name FROM document_templates dt LEFT JOIN users u ON dt.created_by = u.id WHERE dt.is_active = true';
        const params = [];
        if (category && category !== 'all') {
            params.push(category);
            sql += ` AND dt.category = $${params.length}`;
        }
        sql += ' ORDER BY dt.created_at DESC';
        const result = await query(sql, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
documentTemplatesRouter.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await query('SELECT dt.*, u.full_name as author_name FROM document_templates dt LEFT JOIN users u ON dt.created_by = u.id WHERE dt.id = $1', [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Template not found' });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
documentTemplatesRouter.post('/', authenticateToken, requirePermission('templates', 'write'), async (req, res) => {
    const { name, description, category, content } = req.body;
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = req.user;
    try {
        await query('INSERT INTO document_templates (id, name, description, category, content, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [id, name, description, category, JSON.stringify(content), user?.id]);
        createNotification({
            type: 'template_created',
            title: 'Template créé',
            message: `Nouveau template: ${name}`,
            actor_name: user?.name,
            actor_role: user?.role,
            related_id: id,
        });
        res.status(201).json({ id, message: 'Template created' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
documentTemplatesRouter.put('/:id', authenticateToken, requirePermission('templates', 'write'), async (req, res) => {
    const { name, description, category, content } = req.body;
    try {
        const result = await query('UPDATE document_templates SET name = $1, description = $2, category = $3, content = $4, updated_at = NOW() WHERE id = $5 RETURNING id', [name, description, category, JSON.stringify(content), req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Template not found' });
        res.json({ message: 'Template updated' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
documentTemplatesRouter.delete('/:id', authenticateToken, requirePermission('templates', 'delete'), async (req, res) => {
    try {
        const result = await query('DELETE FROM document_templates WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Template not found' });
        res.json({ message: 'Template deleted' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
documentTemplatesRouter.post('/:id/use', authenticateToken, async (req, res) => {
    const { patientId, fields } = req.body;
    const user = req.user;
    try {
        const tplResult = await query('SELECT * FROM document_templates WHERE id = $1', [req.params.id]);
        if (tplResult.rows.length === 0)
            return res.status(404).json({ message: 'Template not found' });
        const template = tplResult.rows[0];
        const content = typeof template.content === 'string' ? JSON.parse(template.content) : template.content;
        let patient = null;
        if (patientId) {
            const pResult = await query('SELECT * FROM patients WHERE id = $1', [patientId]);
            patient = pResult.rows[0] || null;
        }
        const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const generatedContent = {
            ...content,
            fields: { ...(content.fields || {}), ...(fields || {}) },
            patient: patient ? { id: patient.id, first_name: patient.first_name, last_name: patient.last_name } : null,
            generated_at: new Date().toISOString(),
            generated_by: user?.id,
        };
        res.json({ id: docId, template: template.name, category: template.category, content: generatedContent });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
