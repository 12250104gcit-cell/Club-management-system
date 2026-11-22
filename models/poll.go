package models

import "time"

type Poll struct {
	ID          int          `json:"id"`
	ClubID      int          `json:"club_id"`
	CreatedBy   int          `json:"created_by"`
	Question    string       `json:"question"`
	Description string       `json:"description"`
	ClosesAt    time.Time    `json:"closes_at"`
	CreatedAt   time.Time    `json:"created_at"`
	Options     []PollOption `json:"options"`
	IsOpen      bool         `json:"is_open"`
	HasVoted    bool         `json:"has_voted,omitempty"`
}

type PollOption struct {
	ID     int    `json:"id"`
	PollID int    `json:"poll_id"`
	Text   string `json:"text"`
	Votes  int    `json:"votes"`
}

type Vote struct {
	ID        int       `json:"id"`
	PollID    int       `json:"poll_id"`
	OptionID  int       `json:"option_id"`
	UserID    int       `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}
