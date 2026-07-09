import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import emailService from '../lib/emailservices.js';
import { emailTemplates } from '../lib/emailTemplates.js';
export const settingsRouter = Router();
settingsRouter.use(authenticateToken);
settingsRouter.get('/profile', async (req, res) => {
    try {
        const result = await query(`SELECT full_name as "fullName", email, role, phone, address, rpps, specialty, first_name, last_name
             FROM users WHERE id = $1`, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
settingsRouter.put('/profile', async (req, res) => {
    try {
        const { fullName, email, phone, address, rpps, specialty, firstName, lastName } = req.body;
        await query(`UPDATE users SET full_name = $1, email = $2, phone = $3, address = $4, rpps = $5, specialty = $6, first_name = $7, last_name = $8 WHERE id = $9`, [fullName, email, phone || null, address || null, rpps || null, specialty || null, firstName || null, lastName || null, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
settingsRouter.put('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userResult = await query('SELECT password_hash as password FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
settingsRouter.get('/secretaire-permissions', async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id as user_id, u.full_name as full_name, u.email,
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
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
settingsRouter.put('/secretaire-permissions/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const knownKeys = new Set([
            'can_view_patients', 'can_edit_patients', 'can_delete_patients',
            'can_view_appointments', 'can_edit_appointments', 'can_delete_appointments',
            'can_view_chat', 'can_send_chat',
            'can_view_prescriptions', 'can_edit_prescriptions',
            'can_view_vitals', 'can_edit_vitals',
            'can_view_documents', 'can_upload_documents',
            'can_view_consultations'
        ]);
        const dbKey = Object.keys(req.body).find(k => knownKeys.has(k));
        if (!dbKey) {
            return res.status(400).json({ error: 'No valid permission key provided' });
        }
        const value = req.body[dbKey];
        await query(`INSERT INTO secretaire_permissions (user_id, ${dbKey}) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET ${dbKey} = $2`, [userId, value]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
settingsRouter.get('/patient-accounts/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await query('SELECT id, patient_id, username, is_active, created_at FROM patient_accounts WHERE patient_id = $1', [patientId]);
        res.json({ item: result.rows[0] || null });
    }
    catch (error) {
        console.error('Error fetching patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
settingsRouter.post('/patient-accounts', async (req, res) => {
    try {
        const { patientId, username, password } = req.body;
        if (!patientId || !username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const hashed = await bcrypt.hash(password, 10);
        await query(`INSERT INTO patient_accounts (patient_id, username, password_hash) VALUES ($1, $2, $3)
             ON CONFLICT (patient_id) DO UPDATE SET username = $2, password_hash = $3, is_active = TRUE`, [patientId, username, hashed]);
        // Send welcome emails (non-blocking)
        try {
            const patientResult = await query('SELECT first_name, last_name, email FROM patients WHERE id = $1', [patientId]);
            if (patientResult.rows.length > 0) {
                const patient = patientResult.rows[0];
                const appName = process.env.NEXT_SHORT_WEBSITE || 'CardioManager';
                const senderEmail = process.env.EMAIL_SENDER || 'noreply@cardiomanager.fr';
                // Send welcome email to patient
                if (patient.email) {
                    await emailService.sendEmail({
                        to: patient.email,
                        from: { email: senderEmail, name: appName },
                        subject: `Bienvenue sur ${appName}`,
                        html: emailTemplates.welcomePatientClient(patient.first_name, username, password)
                    });
                }
                // Send notification to admin
                const adminEmail = process.env.ADMIN_EMAIL;
                if (adminEmail) {
                    await emailService.sendEmail({
                        to: adminEmail,
                        from: { email: senderEmail, name: appName },
                        subject: `Nouveau patient créé - ${patient.first_name} ${patient.last_name}`,
                        html: emailTemplates.welcomePatientAdmin(patient.first_name, patient.last_name, patient.email, username)
                    });
                }
            }
        }
        catch (emailError) {
            console.error('Error sending welcome email:', emailError);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error creating patient account:', error);
        const detail = error?.detail || error?.message || 'Internal server error';
        res.status(500).json({ error: detail });
    }
});
settingsRouter.put('/patient-accounts/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { isActive, password } = req.body;
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            if (isActive !== undefined) {
                await query('UPDATE patient_accounts SET is_active = $1, password_hash = $2 WHERE patient_id = $3', [isActive, hashed, patientId]);
            }
            else {
                await query('UPDATE patient_accounts SET password_hash = $1 WHERE patient_id = $2', [hashed, patientId]);
            }
        }
        else {
            await query('UPDATE patient_accounts SET is_active = $1 WHERE patient_id = $2', [isActive, patientId]);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating patient account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
