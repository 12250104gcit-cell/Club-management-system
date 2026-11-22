package config

import (
	"database/sql"
	"fmt"
)

func EnsureSchema(db *sql.DB) error {
	statements := []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS programme TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS module TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS year_semester TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS enrollment_number TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS enrolment_year TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`,
		`CREATE TABLE IF NOT EXISTS clubs (club_id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', coordinator_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE SET NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
		`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT ''`,
		`CREATE TABLE IF NOT EXISTS memberships (membership_id SERIAL PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE, status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, decided_at TIMESTAMP, decided_by INTEGER REFERENCES users(user_id))`,
		`CREATE UNIQUE INDEX IF NOT EXISTS one_active_club_per_student ON memberships(student_id) WHERE status IN ('pending','approved')`,
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
