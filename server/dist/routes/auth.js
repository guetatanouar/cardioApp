import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
export const authRouter = Router();
authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT id, username, email, full_name as name, role, password_hash FROM users WHERE username = $1 OR email = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
        let permissions = null;
        if (user.role === 'secretaire') {
            const permResult = await query('SELECT * FROM secretaire_permissions WHERE user_id = $1', [user.id]);
            permissions = permResult.rows[0] || null;
        }
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.name,
                email: user.email,
                permissions
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
authRouter.post('/patient-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT *, password_hash as password FROM patient_accounts WHERE username = $1 AND is_active IS NOT FALSE', [username]);
        const account = result.rows[0];
        if (!account || !(await bcrypt.compare(password, account.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const patientResult = await query('SELECT * FROM patients WHERE id = $1', [account.patient_id]);
        const patient = patientResult.rows[0];
        const token = jwt.sign({ id: account.id, username: account.username, role: 'patient', patientId: patient.id, name: `${patient.first_name} ${patient.last_name}` }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, patientId: patient.id, user: { id: account.id, username: account.username, role: 'patient', patientId: patient.id, name: `${patient.first_name} ${patient.last_name}` } });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
