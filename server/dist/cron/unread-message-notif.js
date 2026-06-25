import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { query } from '../db/pool.js';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});
async function sendEmail(to, subject, text) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[Email Notif] Would send to ${to}: ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@cardiomanager.app',
            to,
            subject,
            text,
        });
    }
    catch (err) {
        console.error('[Email Notif] Failed to send email:', err);
    }
}
async function notifyUnreadMessages() {
    try {
        const result = await query(`SELECT cm.*, u.full_name as sender_name, p.email as patient_email
       FROM chat_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       LEFT JOIN patients p ON cm.patient_id = p.id
       WHERE cm.is_read = FALSE AND cm.notified = FALSE
       ORDER BY cm.created_at ASC`);
        const messages = result.rows;
        if (messages.length === 0)
            return;
        const staffUsers = (await query(`SELECT id, full_name, email, role FROM users WHERE role IN ('admin', 'secretaire')`)).rows;
        const notifiedIds = [];
        for (const msg of messages) {
            if (msg.channel === 'staff') {
                const recipients = staffUsers.filter((u) => u.id !== msg.sender_id);
                for (const recipient of recipients) {
                    if (recipient.email) {
                        await sendEmail(recipient.email, `Nouveau message de ${msg.sender_name || 'un collègue'}`, `Vous avez reçu un nouveau message de ${msg.sender_name || 'un collègue'} dans le canal staff. Connectez-vous pour le consulter.`);
                    }
                }
                notifiedIds.push(msg.id);
            }
            else if (msg.channel === 'patient' && msg.patient_email) {
                await sendEmail(msg.patient_email, `Nouveau message de votre médecin`, `Vous avez reçu un nouveau message de ${msg.sender_name || 'votre médecin'}. Connectez-vous à votre espace patient pour le consulter.`);
                notifiedIds.push(msg.id);
            }
        }
        if (notifiedIds.length > 0) {
            const placeholders = notifiedIds.map((_, i) => `$${i + 1}`).join(',');
            await query(`UPDATE chat_messages SET notified = TRUE WHERE id IN (${placeholders})`, notifiedIds);
            console.log(`[Email Notif] Marked ${notifiedIds.length} messages as notified`);
        }
    }
    catch (err) {
        console.error('[Email Notif] Error:', err);
    }
}
export function startUnreadMessageCron() {
    const interval = process.env.CRON_INTERVAL || '*/2 * * * *';
    cron.schedule(interval, () => {
        notifyUnreadMessages();
    });
    console.log(`[Email Notif] Cron scheduled: ${interval}`);
    notifyUnreadMessages();
}
