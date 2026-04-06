import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

export const settingsRouter = Router();

settingsRouter.use(authenticateToken);

settingsRouter.get('/profile', async (req, res) => {
    try {
        const result = await query(
            'SELECT full_name as "fullName", email, role FROM users WHERE id = $1',
            [(req as any).user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.put('/profile', async (req, res) => {
    try {
        const { fullName, email } = req.body;
        await query(
            'UPDATE users SET full_name = $1, email = $2 WHERE id = $3',
            [fullName, email, (req as any).user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.put('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const bcrypt = await import('bcryptjs');
        const userResult = await query('SELECT password FROM users WHERE id = $1', [(req as any).user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, (req as any).user.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.get('/secretaire-permissions', async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id as user_id, u.full_name, u.email,
                COALESCE(p.can_view_patients, false) as can_view_patients,
                COALESCE(p.can_edit_patients, false) as can_edit_patients,
                COALESCE(p.can_delete_patients, false) as can_delete_patients,
                COALESCE(p.can_view_appointments, false) as can_view_appointments,
                COALESCE(p.can_edit_appointments, false) as can_edit_appointments,
                COALESCE(p.can_delete_appointments, false) as can_delete_appointments,
                COALESCE(p.can_view_chat, false) as can_view_chat,
                COALESCE(p.can_send_chat, false) as can_send_chat,
                COALESCE(p.can_view_prescriptions, false) as can_view_prescriptions,
                COALESCE(p.can_edit_prescriptions, false) as can_edit_prescriptions,
                COALESCE(p.can_view_vitals, false) as can_view_vitals,
                COALESCE(p.can_edit_vitals, false) as can_edit_vitals,
                COALESCE(p.can_view_documents, false) as can_view_documents,
                COALESCE(p.can_upload_documents, false) as can_upload_documents,
                COALESCE(p.can_view_consultations, false) as can_view_consultations
            FROM users u
            LEFT JOIN secretaire_permissions p ON u.id = p.user_id
            WHERE u.role = 'secretaire'
            ORDER BY u.full_name
        `);
        res.json({ items: result.rows });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.put('/secretaire-permissions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const permissions = ['can_view_patients', 'can_edit_patients', 'can_delete_patients',
            'can_view_appointments', 'can_edit_appointments', 'can_delete_appointments',
            'can_view_chat', 'can_send_chat', 'can_view_prescriptions', 'can_edit_prescriptions',
            'can_view_vitals', 'can_edit_vitals', 'can_view_documents', 'can_upload_documents',
            'can_view_consultations'];
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        const permissionKeys = ['canViewPatients', 'canEditPatients', 'canDeletePatients',
            'canViewAppointments', 'canEditAppointments', 'canDeleteAppointments',
            'canViewChat', 'canSendChat', 'canViewPrescriptions', 'canEditPrescriptions',
            'canViewVitals', 'canEditVitals', 'canViewDocuments', 'canUploadDocuments',
            'canViewConsultations'];

        for (let i = 0; i < permissions.length; i++) {
            if (req.body[permissionKeys[i]] !== undefined) {
                updates.push(`${permissions[i]} = $${paramIndex}`);
                values.push(req.body[permissionKeys[i]]);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No permissions to update' });
        }

        values.push(userId);

        const insertValues = permissions.map((_, i) => {
            const key = permissionKeys[i];
            return req.body[key] !== undefined ? req.body[key] : false;
        });
        insertValues.push(userId);

        await query(`
            INSERT INTO secretaire_permissions (user_id, ${permissions.join(', ')})
            VALUES ($${paramIndex}, ${permissions.map((_, i) => `$${i + 1}`).join(', ')})
            ON CONFLICT (user_id) DO UPDATE SET ${updates.join(', ')}
        `, insertValues);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.get('/patient-accounts/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await query(
            'SELECT id, patient_id, username, is_active, created_at FROM patient_accounts WHERE patient_id = $1',
            [patientId]
        );
        res.json({ item: result.rows[0] || null });
    } catch (error) {
        console.error('Error fetching patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.post('/patient-accounts', async (req, res) => {
    try {
        const { patientId, username, password } = req.body;
        const bcrypt = await import('bcryptjs');
        const hashed = await bcrypt.hash(password, 10);
        await query(
            'INSERT INTO patient_accounts (patient_id, username, password) VALUES ($1, $2, $3)',
            [patientId, username, hashed]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

settingsRouter.put('/patient-accounts/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { isActive, password } = req.body;
        if (password) {
            const bcrypt = await import('bcryptjs');
            const hashed = await bcrypt.hash(password, 10);
            await query('UPDATE patient_accounts SET is_active = $1, password = $2 WHERE patient_id = $3', [isActive, hashed, patientId]);
        } else {
            await query('UPDATE patient_accounts SET is_active = $1 WHERE patient_id = $2', [isActive, patientId]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
