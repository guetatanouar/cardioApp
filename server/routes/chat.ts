import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { createNotification } from '../lib/createNotification.js';

export const chatRouter = Router();

chatRouter.get('/', authenticateToken, requirePermission('chat'), async (req, res) => {
    const { channel } = req.query;
    const user = (req as any).user;
    try {
        let result;
        if (channel === 'staff') {
            result = await query('SELECT * FROM chat_messages WHERE channel = \'staff\' ORDER BY created_at ASC');
        } else if (typeof channel === 'string' && channel.startsWith('patient_medical:')) {
            const patientId = channel.replace('patient_medical:', '');
            if (user.role === 'secretaire') {
                return res.status(403).json({ message: 'Accès refusé aux conversations médicales' });
            }
            result = await query(
                'SELECT * FROM chat_messages WHERE channel = \'patient\' AND patient_id = $1 AND conversation_type = \'medical\' ORDER BY created_at ASC',
                [patientId]
            );
        } else if (typeof channel === 'string' && channel.startsWith('patient_rdv:')) {
            const patientId = channel.replace('patient_rdv:', '');
            if (user.role === 'admin') {
                return res.status(403).json({ message: 'Accès refusé aux conversations de rendez-vous' });
            }
            result = await query(
                'SELECT * FROM chat_messages WHERE channel = \'patient\' AND patient_id = $1 AND conversation_type = \'rdv\' ORDER BY created_at ASC',
                [patientId]
            );
        } else if (typeof channel === 'string' && channel.startsWith('patient:')) {
            const patientId = channel.replace('patient:', '');
            result = await query(
                'SELECT * FROM chat_messages WHERE channel = \'patient\' AND patient_id = $1 ORDER BY created_at ASC',
                [patientId]
            );
        } else {
            result = await query('SELECT * FROM chat_messages ORDER BY created_at ASC');
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

chatRouter.post('/', authenticateToken, requirePermission('chat', 'send'), async (req, res) => {
    const { channel, content } = req.body;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = (req as any).user;
    let patient_id: string | undefined = undefined;
    let sender_role = user.role;
    let sender_id = user.id;
    let actualChannel = 'staff';
    let actualConversationType: string | null = null;

    if (typeof channel === 'string' && channel.startsWith('patient_medical:')) {
        patient_id = channel.replace('patient_medical:', '');
        sender_role = user.role === 'patient' ? 'patient' : 'admin';
        sender_id = user.id;
        actualChannel = 'patient';
        actualConversationType = 'medical';
    } else if (typeof channel === 'string' && channel.startsWith('patient_rdv:')) {
        patient_id = channel.replace('patient_rdv:', '');
        sender_role = user.role === 'patient' ? 'patient' : 'secretaire';
        sender_id = user.id;
        actualChannel = 'patient';
        actualConversationType = 'rdv';
    } else if (typeof channel === 'string' && channel.startsWith('patient:')) {
        patient_id = channel.replace('patient:', '');
        sender_role = user.role === 'patient' ? 'patient' : 'staff';
        sender_id = user.id;
        actualChannel = 'patient';
        actualConversationType = 'medical';
    }

    if (actualChannel === 'patient' && actualConversationType === 'medical' && user.role === 'secretaire') {
        return res.status(403).json({ message: 'Accès refusé aux conversations médicales' });
    }
    if (actualChannel === 'patient' && actualConversationType === 'rdv' && user.role === 'admin') {
        return res.status(403).json({ message: 'Accès refusé aux conversations de rendez-vous' });
    }

    try {
        await query(
            'INSERT INTO chat_messages (id, channel, conversation_type, sender_role, sender_id, patient_id, content) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, actualChannel, actualConversationType, sender_role, sender_id, patient_id, content]
        );
        if (actualChannel === 'staff' && sender_role !== 'admin') {
            createNotification({
                type: 'chat_message',
                title: 'Nouveau message',
                message: `Message de ${user.name}: ${content.substring(0, 100)}`,
                actor_name: user.name,
                actor_role: sender_role,
                related_id: id,
            });
        }
        if (actualChannel === 'patient' && sender_role === 'patient') {
            createNotification({
                type: 'chat_message',
                title: actualConversationType === 'medical' ? 'Nouveau message médical' : 'Nouveau message rendez-vous',
                message: `Message de ${user.name}: ${content.substring(0, 100)}`,
                actor_name: user.name,
                actor_role: sender_role,
                patient_id: patient_id,
                related_id: id,
            });
        }
        if (actualChannel === 'patient' && sender_role !== 'patient') {
            createNotification({
                type: 'chat_message',
                title: actualConversationType === 'medical' ? 'Réponse médicale' : 'Réponse rendez-vous',
                message: `Message de ${user.name}: ${content.substring(0, 100)}`,
                actor_name: user.name,
                actor_role: sender_role,
                patient_id: patient_id,
                related_id: id,
            });
        }
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

chatRouter.post('/mark-read', authenticateToken, requirePermission('chat'), async (req, res) => {
    const { channel } = req.body;
    const user = (req as any).user;
    try {
        if (typeof channel === 'string' && channel.startsWith('patient_medical:')) {
            const patientId = channel.replace('patient_medical:', '');
            if (user.role === 'secretaire') {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            await query(
                'UPDATE chat_messages SET is_read = TRUE WHERE channel = \'patient\' AND patient_id = $1 AND conversation_type = \'medical\' AND is_read = FALSE',
                [patientId]
            );
        } else if (typeof channel === 'string' && channel.startsWith('patient_rdv:')) {
            const patientId = channel.replace('patient_rdv:', '');
            if (user.role === 'admin') {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            await query(
                'UPDATE chat_messages SET is_read = TRUE WHERE channel = \'patient\' AND patient_id = $1 AND conversation_type = \'rdv\' AND is_read = FALSE',
                [patientId]
            );
        } else if (typeof channel === 'string' && channel.startsWith('patient:')) {
            const patientId = channel.replace('patient:', '');
            await query(
                'UPDATE chat_messages SET is_read = TRUE WHERE channel = \'patient\' AND patient_id = $1 AND is_read = FALSE',
                [patientId]
            );
        } else {
            await query('UPDATE chat_messages SET is_read = TRUE WHERE channel = $1 AND is_read = FALSE', [channel]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
