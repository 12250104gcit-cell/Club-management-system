package models

import "time"

type User struct {
	UserID             int       `json:"user_id"`
	FullName           string    `json:"full_name"`
	Email              string    `json:"email"`
	PasswordHash       string    `json:"-"`
	Role               string    `json:"role"`
	IsActive           bool      `json:"is_active"`
	MustChangePassword bool      `json:"must_change_password"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
