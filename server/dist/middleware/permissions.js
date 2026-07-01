import { query } from '../db/pool.js';
const permMap = {
    patients: 'can_view_patients',
    'patients:write': 'can_edit_patients',
    'patients:delete': 'can_delete_patients',
    appointments: 'can_view_appointments',
    'appointments:write': 'can_edit_appointments',
    'appointments:delete': 'can_delete_appointments',
    chat: 'can_view_chat',
    'chat:send': 'can_send_chat',
    prescriptions: 'can_view_prescriptions',
    'prescriptions:write': 'can_edit_prescriptions',
    vitals: 'can_view_vitals',
    'vitals:write': 'can_edit_vitals',
    'vitals:delete': 'can_edit_vitals',
    documents: 'can_view_documents',
    'documents:write': 'can_upload_documents',
    consultations: 'can_view_consultations'
};
export function requirePermission(resource, action = 'read') {
    return async (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Non authentifié' });
        // Admin always passes
        if (user.role === 'admin')
            return next();
        // Patients can access chat and documents (their own)
        if (user.role === 'patient' && (resource === 'chat' || resource === 'documents'))
            return next();
        // Only secretaries need row-level permission checks
        if (user.role !== 'secretaire') {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        const permKey = action === 'read' ? resource : `${resource}:${action}`;
        const dbKey = permMap[permKey] || permMap[resource];
        if (!dbKey)
            return next();
        try {
            const result = await query(`SELECT ${dbKey} as allowed FROM secretaire_permissions WHERE user_id = $1`, [user.id]);
            const allowed = result.rows[0]?.allowed;
            if (!allowed)
                return res.status(403).json({ error: 'Permission denied' });
            next();
        }
        catch (err) {
            console.error('Permission check error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
