package config

import (
	"database/sql"
	"fmt"
)

func EnsureSchema(db *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (user_id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, must_change_password BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS programme TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS module TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS year_semester TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS enrollment_number TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS enrolment_year TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`,
		`CREATE TABLE IF NOT EXISTS clubs (club_id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active', tagline TEXT NOT NULL DEFAULT '', cover_image TEXT NOT NULL DEFAULT '', show_category BOOLEAN NOT NULL DEFAULT TRUE, show_coordinator BOOLEAN NOT NULL DEFAULT TRUE, show_member_count BOOLEAN NOT NULL DEFAULT TRUE, show_about BOOLEAN NOT NULL DEFAULT TRUE, coordinator_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS cover_image TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS show_category BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS show_coordinator BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS show_member_count BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS show_about BOOLEAN NOT NULL DEFAULT TRUE`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
		`ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_status_check`,
		`ALTER TABLE clubs ADD CONSTRAINT clubs_status_check CHECK(status IN ('active','inactive'))`,
		`CREATE TABLE IF NOT EXISTS memberships (membership_id SERIAL PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE, status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, decided_at TIMESTAMP, decided_by INTEGER REFERENCES users(user_id))`,
		`CREATE TABLE IF NOT EXISTS student_notifications (notification_id SERIAL PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, notification_type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), read_at TIMESTAMPTZ)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS one_active_club_per_student ON memberships(student_id) WHERE status IN ('pending','approved')`,
		`ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check`,
		`ALTER TABLE memberships ADD CONSTRAINT memberships_status_check CHECK(status IN ('pending','approved','rejected','leave_requested','left','removed'))`,
		`DROP INDEX IF EXISTS one_active_club_per_student`,
		`CREATE UNIQUE INDEX one_active_club_per_student ON memberships(student_id) WHERE status IN ('pending','approved','leave_requested')`,
		`CREATE TABLE IF NOT EXISTS announcements (announcement_id SERIAL PRIMARY KEY, club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE, created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'General', body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
		`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General'`,
		`CREATE TABLE IF NOT EXISTS polls (poll_id SERIAL PRIMARY KEY, club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE, created_by INTEGER NOT NULL REFERENCES users(user_id), question TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', closes_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
		`CREATE TABLE IF NOT EXISTS poll_options (option_id SERIAL PRIMARY KEY, poll_id INTEGER NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE, text TEXT NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS votes (vote_id SERIAL PRIMARY KEY, poll_id INTEGER NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE, option_id INTEGER NOT NULL REFERENCES poll_options(option_id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(poll_id,user_id))`,
		`CREATE TABLE IF NOT EXISTS revoked_tokens (token_hash TEXT PRIMARY KEY, expires_at TIMESTAMPTZ NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS auth_handoffs (code_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, token TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL)`,
	}
	for i, statement := range statements {
		if _, err := db.Exec(statement); err != nil {
			return fmt.Errorf("schema statement %d failed: %w", i+1, err)
		}
	}
	return nil
}
