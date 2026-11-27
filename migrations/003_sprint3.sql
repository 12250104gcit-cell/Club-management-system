-- Sprint 3: retain membership history while expanding active club states.
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('pending','approved','rejected','leave_requested','left','removed'));
DROP INDEX IF EXISTS one_active_club_per_student;
CREATE UNIQUE INDEX one_active_club_per_student ON memberships(student_id)
  WHERE status IN ('pending','approved','leave_requested');

CREATE TABLE IF NOT EXISTS announcements (
  announcement_id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';
