ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_key TEXT;

UPDATE notifications SET group_key = 'legacy_' || id WHERE group_key IS NULL;