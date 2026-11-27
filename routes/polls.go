package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"club-management-system/utils"
	"github.com/gorilla/mux"
)

func registerPollRoutes(router *mux.Router, db *sql.DB, protect func([]string, http.HandlerFunc) http.Handler, coordinatorClub func(int) (int, error), out func(http.ResponseWriter, int, any)) {
	list := func(w http.ResponseWriter, cid int, studentID int) {
		rows, err := db.Query("SELECT p.poll_id,p.question,p.description,p.closes_at,EXISTS(SELECT 1 FROM votes v WHERE v.poll_id=p.poll_id AND v.user_id=$2) FROM polls p WHERE p.club_id=$1 ORDER BY p.created_at DESC", cid, studentID)
		if err != nil {
			out(w, 500, map[string]string{"error": "Could not load polls"})
			return
		}
		defer rows.Close()
		items := []any{}
		for rows.Next() {
			var id int
			var question, description string
			var closes time.Time
			var voted bool
			if rows.Scan(&id, &question, &description, &closes, &voted) != nil {
				continue
			}
			opts, e := db.Query("SELECT o.option_id,o.text,COUNT(v.vote_id) FROM poll_options o LEFT JOIN votes v ON v.option_id=o.option_id WHERE o.poll_id=$1 GROUP BY o.option_id ORDER BY o.option_id", id)
			if e != nil {
				out(w, 500, map[string]string{"error": "Could not load poll options"})
				return
			}
			options := []map[string]any{}
			total := 0
			for opts.Next() {
				var oid, count int
				var text string
				if opts.Scan(&oid, &text, &count) == nil {
					total += count
					options = append(options, map[string]any{"id": oid, "text": text, "votes": count})
				}
			}
			opts.Close()
			for _, o := range options {
				pct := 0
				if total > 0 {
					pct = o["votes"].(int) * 100 / total
				}
				o["percentage"] = pct
			}
			var chosen any
			if studentID > 0 {
				_ = db.QueryRow("SELECT option_id FROM votes WHERE poll_id=$1 AND user_id=$2", id, studentID).Scan(&chosen)
			}
			open := time.Now().Before(closes)
			items = append(items, map[string]any{"id": id, "title": question, "question": question, "description": description, "closes_at": closes, "endDate": closes, "is_open": open, "status": map[bool]string{true: "Active", false: "Closed"}[open], "has_voted": voted, "voted_option_id": chosen, "total_votes": total, "options": options})
		}
		out(w, 200, items)
	}
	router.Handle("/api/coordinator/polls", protect([]string{"coordinator"}, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		cid, e := coordinatorClub(uid)
		if e != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		if r.Method == http.MethodGet {
			list(w, cid, 0)
			return
		}
		var x struct {
			Question    string    `json:"question"`
			Description string    `json:"description"`
			ClosesAt    time.Time `json:"closes_at"`
			Options     []string  `json:"options"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.Question) == "" || len(x.Options) < 2 || !x.ClosesAt.After(time.Now()) {
			out(w, 422, map[string]string{"error": "A question, at least two options, and a future closing time are required"})
			return
		}
		for i := range x.Options {
			x.Options[i] = strings.TrimSpace(x.Options[i])
			if x.Options[i] == "" || duplicateOption(x.Options[:i], x.Options[i]) {
				out(w, 422, map[string]string{"error": "Poll options must be non-empty and different"})
				return
			}
		}
		tx, e := db.Begin()
		if e != nil {
			out(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer tx.Rollback()
		var id int
		if e = tx.QueryRow("INSERT INTO polls(club_id,created_by,question,description,closes_at) VALUES($1,$2,$3,$4,$5) RETURNING poll_id", cid, uid, strings.TrimSpace(x.Question), strings.TrimSpace(x.Description), x.ClosesAt).Scan(&id); e != nil {
			out(w, 500, map[string]string{"error": "Could not create poll"})
			return
		}
		for _, option := range x.Options {
			if _, e = tx.Exec("INSERT INTO poll_options(poll_id,text) VALUES($1,$2)", id, option); e != nil {
				out(w, 500, map[string]string{"error": "Could not save poll options"})
				return
			}
		}
		if tx.Commit() != nil {
			out(w, 500, map[string]string{"error": "Could not create poll"})
			return
		}
		list(w, cid, 0)
	})).Methods("GET", "POST")
	router.Handle("/api/coordinator/polls/{id}", protect([]string{"coordinator"}, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		cid, err := coordinatorClub(uid)
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		if err != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		if r.Method == http.MethodDelete {
			res, e := db.Exec("DELETE FROM polls WHERE poll_id=$1 AND club_id=$2", id, cid)
			if e != nil {
				out(w, 500, map[string]string{"error": "Could not delete poll"})
				return
			}
			n, _ := res.RowsAffected()
			if n == 0 {
				out(w, 404, map[string]string{"error": "Poll not found for your club"})
				return
			}
			out(w, 200, map[string]string{"message": "Poll deleted"})
			return
		}
		var x struct {
			Question    string    `json:"question"`
			Description string    `json:"description"`
			ClosesAt    time.Time `json:"closes_at"`
			Options     []string  `json:"options"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.Question) == "" || len(x.Options) < 2 || !x.ClosesAt.After(time.Now()) {
			out(w, 422, map[string]string{"error": "A question, at least two options, and a future closing time are required"})
			return
		}
		for i := range x.Options {
			x.Options[i] = strings.TrimSpace(x.Options[i])
			if x.Options[i] == "" || duplicateOption(x.Options[:i], x.Options[i]) {
				out(w, 422, map[string]string{"error": "Poll options must be non-empty and different"})
				return
			}
		}
		tx, e := db.Begin()
		if e != nil {
			out(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer tx.Rollback()
		var lockedID int
		if tx.QueryRow("SELECT poll_id FROM polls WHERE poll_id=$1 AND club_id=$2 FOR UPDATE", id, cid).Scan(&lockedID) != nil {
			out(w, 404, map[string]string{"error": "Poll not found for your club"})
			return
		}
		var voted bool
		if tx.QueryRow("SELECT EXISTS(SELECT 1 FROM votes WHERE poll_id=$1)", id).Scan(&voted) != nil {
			out(w, 500, map[string]string{"error": "Could not check poll votes"})
			return
		}
		if voted {
			rows, e := tx.Query("SELECT text FROM poll_options WHERE poll_id=$1 ORDER BY option_id", id)
			if e != nil {
				out(w, 500, map[string]string{"error": "Could not load poll options"})
				return
			}
			old := []string{}
			for rows.Next() {
				var s string
				if rows.Scan(&s) == nil {
					old = append(old, s)
				}
			}
			rows.Close()
			if len(old) != len(x.Options) {
				out(w, 409, map[string]string{"error": "Options cannot change after voting begins"})
				return
			}
			for i := range old {
				if old[i] != x.Options[i] {
					out(w, 409, map[string]string{"error": "Options cannot change after voting begins"})
					return
				}
			}
		}
		if _, e = tx.Exec("UPDATE polls SET question=$1,description=$2,closes_at=$3 WHERE poll_id=$4 AND club_id=$5", strings.TrimSpace(x.Question), strings.TrimSpace(x.Description), x.ClosesAt, id, cid); e != nil {
			out(w, 500, map[string]string{"error": "Could not update poll"})
			return
		}
		if !voted {
			if _, e = tx.Exec("DELETE FROM poll_options WHERE poll_id=$1", id); e != nil {
				out(w, 500, map[string]string{"error": "Could not update poll options"})
				return
			}
			for _, option := range x.Options {
				if _, e = tx.Exec("INSERT INTO poll_options(poll_id,text) VALUES($1,$2)", id, option); e != nil {
					out(w, 500, map[string]string{"error": "Could not update poll options"})
					return
				}
			}
		}
		if tx.Commit() != nil {
			out(w, 500, map[string]string{"error": "Could not update poll"})
			return
		}
		list(w, cid, 0)
	})).Methods("PUT", "DELETE")
	router.Handle("/api/student/polls", protect([]string{"student"}, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		var cid int
		if db.QueryRow("SELECT club_id FROM memberships WHERE student_id=$1 AND status IN ('approved','leave_requested')", uid).Scan(&cid) != nil {
			out(w, 403, map[string]string{"error": "An approved club membership is required"})
			return
		}
		list(w, cid, uid)
	})).Methods("GET")
	router.Handle("/api/student/polls/{id}/votes", protect([]string{"student"}, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		var x struct {
			OptionID int `json:"option_id"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || x.OptionID < 1 {
			out(w, 422, map[string]string{"error": "option_id is required"})
			return
		}
		tx, e := db.Begin()
		if e != nil {
			out(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer tx.Rollback()
		var cid int
		var closes time.Time
		if tx.QueryRow("SELECT club_id,closes_at FROM polls WHERE poll_id=$1 FOR UPDATE", id).Scan(&cid, &closes) != nil {
			out(w, 404, map[string]string{"error": "Poll not found"})
			return
		}
		var approved bool
		_ = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM memberships WHERE student_id=$1 AND club_id=$2 AND status IN ('approved','leave_requested'))", uid, cid).Scan(&approved)
		if !approved {
			out(w, 403, map[string]string{"error": "An approved member of this poll's club is required"})
			return
		}
		if !time.Now().Before(closes) {
			out(w, 409, map[string]string{"error": "This poll is closed; votes are no longer accepted"})
			return
		}
		var valid bool
		_ = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM poll_options WHERE option_id=$1 AND poll_id=$2)", x.OptionID, id).Scan(&valid)
		if !valid {
			out(w, 422, map[string]string{"error": "Option does not belong to this poll"})
			return
		}
		_, e = tx.Exec("INSERT INTO votes(poll_id,option_id,user_id) VALUES($1,$2,$3)", id, x.OptionID, uid)
		if e != nil {
			out(w, 409, map[string]string{"error": "You have already voted in this poll"})
			return
		}
		if tx.Commit() != nil {
			out(w, 500, map[string]string{"error": "Could not record vote"})
			return
		}
		out(w, 201, map[string]string{"message": "Vote recorded"})
	})).Methods("POST")
}

func duplicateOption(previous []string, candidate string) bool {
	for _, value := range previous {
		if strings.EqualFold(value, candidate) {
			return true
		}
	}
	return false
}
