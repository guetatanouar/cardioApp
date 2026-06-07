import { query } from '../db/pool.js';

export async function createNotification(params: {
    type: string;
    title: string;
    message?: string;
    actor_name?: string;
    actor_role?: string;
    patient_id?: string;
    related_id?: string;
}) {
    try {
        await query(
            `INSERT INTO notifications (type, title, message, actor_name, actor_role, patient_id, related_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [params.type, params.title, params.message || null, params.actor_name || null, params.actor_role || null, params.patient_id || null, params.related_id || null]
        );
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}
