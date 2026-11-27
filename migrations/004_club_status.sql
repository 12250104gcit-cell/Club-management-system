-- Add an Admin-managed club lifecycle status; existing clubs stay active.
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_status_check;
ALTER TABLE clubs ADD CONSTRAINT clubs_status_check CHECK (status IN ('active','inactive'));
