package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"club-management-system/utils"
	"github.com/gorilla/mux"
)

func registerSprint3Routes(r *mux.Router, db *sql.DB, protect func([]string, http.HandlerFunc) http.Handler, coordinatorClub func(int) (int, error), out func(http.ResponseWriter, int, any)) {
	student, coord := []string{"student"}, []string{"coordinator"}
	r.Handle("/api/student/notifications", protect(student, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		rows, err := db.Query(`SELECT notification_id,notification_type,title,message,created_at FROM student_notifications WHERE student_id=$1 AND read_at IS NULL ORDER BY created_at,notification_id`, uid)
		if err != nil {
			out(w, 500, map[string]string{"error": "Could not load notifications"})
			return
		}
		defer rows.Close()
		items := []any{}
		for rows.Next() {
			var id int
			var kind, title, message string
			var created interface{}
			if rows.Scan(&id, &kind, &title, &message, &created) == nil {
				items = append(items, map[string]any{"id": id, "type": kind, "title": title, "message": message, "created_at": created})
			}
		}
		out(w, 200, items)
	})).Methods("GET")
	r.Handle("/api/student/notifications/{id}/read", protect(student, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		id, _ := strconv.Atoi(mux.Vars(req)["id"])
		res, err := db.Exec(`UPDATE student_notifications SET read_at=NOW() WHERE notification_id=$1 AND student_id=$2 AND read_at IS NULL`, id, uid)
		if err != nil {
			out(w, 500, map[string]string{"error": "Could not update notification"})
			return
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			out(w, 404, map[string]string{"error": "Notification not found"})
			return
		}
		out(w, 200, map[string]string{"status": "read"})
	})).Methods("POST")
	r.Handle("/api/coordinator/club", protect(coord, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		cid, err := coordinatorClub(uid)
		if err != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		if req.Method == http.MethodGet {
			var name, tagline, description, category, coverImage, coordinatorName string
			var showCategory, showCoordinator, showMemberCount, showAbout bool
			var members int
			err = db.QueryRow(`SELECT c.name,c.tagline,c.description,c.category,c.cover_image,c.show_category,c.show_coordinator,c.show_member_count,c.show_about,COALESCE(u.full_name,''),(SELECT COUNT(*) FROM memberships m WHERE m.club_id=c.club_id AND m.status IN ('approved','leave_requested')) FROM clubs c LEFT JOIN users u ON u.user_id=c.coordinator_id WHERE c.club_id=$1`, cid).Scan(&name, &tagline, &description, &category, &coverImage, &showCategory, &showCoordinator, &showMemberCount, &showAbout, &coordinatorName, &members)
			if err != nil {
				out(w, 404, map[string]string{"error": "Club not found"})
				return
			}
			out(w, 200, map[string]any{"id": cid, "name": name, "tagline": tagline, "description": description, "category": category, "cover_image": coverImage, "show_category": showCategory, "show_coordinator": showCoordinator, "show_member_count": showMemberCount, "show_about": showAbout, "coordinator_name": coordinatorName, "members": members})
			return
		}
		var x struct {
			Name            string `json:"name"`
			Tagline         string `json:"tagline"`
			Description     string `json:"description"`
			Category        string `json:"category"`
			CoverImage      string `json:"cover_image"`
			ShowCategory    bool   `json:"show_category"`
			ShowCoordinator bool   `json:"show_coordinator"`
			ShowMemberCount bool   `json:"show_member_count"`
			ShowAbout       bool   `json:"show_about"`
		}
		if json.NewDecoder(req.Body).Decode(&x) != nil {
			out(w, 422, map[string]string{"error": "Club name and profile details are required"})
			return
		}
		x.Name, x.Tagline, x.Description, x.Category, x.CoverImage = strings.TrimSpace(x.Name), strings.TrimSpace(x.Tagline), strings.TrimSpace(x.Description), strings.TrimSpace(x.Category), strings.TrimSpace(x.CoverImage)
		if x.Name == "" || len(x.Name) > 120 || len(x.Tagline) > 240 || len(x.Description) > 4000 || len(x.Category) > 100 || len(x.CoverImage) > 2048 || (x.CoverImage != "" && !strings.HasPrefix(x.CoverImage, "/") && !strings.HasPrefix(x.CoverImage, "https://") && !strings.HasPrefix(x.CoverImage, "http://")) {
			out(w, 422, map[string]string{"error": "Please enter valid club profile details and a safe image URL"})
			return
		}
		_, err = db.Exec(`UPDATE clubs SET name=$1,tagline=$2,description=$3,category=$4,cover_image=$5,show_category=$6,show_coordinator=$7,show_member_count=$8,show_about=$9 WHERE club_id=$10`, x.Name, x.Tagline, x.Description, x.Category, x.CoverImage, x.ShowCategory, x.ShowCoordinator, x.ShowMemberCount, x.ShowAbout, cid)
		if err != nil {
			out(w, 409, map[string]string{"error": "Could not save club profile; the name may already be in use"})
			return
		}
		out(w, 200, map[string]string{"message": "Club profile updated"})
	})).Methods("GET", "PUT")
	r.Handle("/api/student/announcements", protect(student, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		var cid int
		if db.QueryRow(`SELECT club_id FROM memberships WHERE student_id=$1 AND status IN ('approved','leave_requested')`, uid).Scan(&cid) != nil {
			out(w, 403, map[string]string{"error": "An approved club membership is required"})
			return
		}
		rows, err := db.Query(`SELECT announcement_id,title,category,body,created_at,updated_at FROM announcements WHERE club_id=$1 ORDER BY created_at DESC`, cid)
		if err != nil {
			out(w, 500, map[string]string{"error": "Could not load announcements"})
			return
		}
		defer rows.Close()
		items := []any{}
		for rows.Next() {
			var id int
			var title, category, body string
			var created, updated interface{}
			if rows.Scan(&id, &title, &category, &body, &created, &updated) == nil {
				items = append(items, map[string]any{"id": id, "title": title, "category": category, "body": body, "message": body, "created_at": created, "updated_at": updated})
			}
		}
		out(w, 200, items)
	})).Methods("GET")
	r.Handle("/api/student/leave-request", protect(student, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		res, err := db.Exec(`UPDATE memberships SET status='leave_requested',decided_at=NOW() WHERE student_id=$1 AND status='approved'`, uid)
		if err != nil {
			out(w, 409, map[string]string{"error": "A leave request is already active or your membership is unavailable"})
			return
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			out(w, 409, map[string]string{"error": "Only an approved member can request to leave"})
			return
		}
		out(w, 200, map[string]string{"status": "leave_requested"})
	})).Methods("POST")
	r.Handle("/api/coordinator/leave-requests", protect(coord, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		cid, err := coordinatorClub(uid)
		if err != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		rows, err := db.Query(`SELECT m.membership_id,u.full_name,u.email FROM memberships m JOIN users u ON u.user_id=m.student_id WHERE m.club_id=$1 AND m.status='leave_requested' ORDER BY m.created_at`, cid)
		if err != nil {
			out(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer rows.Close()
		items := []any{}
		for rows.Next() {
			var id int
			var name, email string
			if rows.Scan(&id, &name, &email) == nil {
				items = append(items, map[string]any{"id": id, "name": name, "email": email, "status": "leave_requested"})
			}
		}
		out(w, 200, items)
	})).Methods("GET")
	r.Handle("/api/coordinator/leave-requests/{id}", protect(coord, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		cid, err := coordinatorClub(uid)
		id, _ := strconv.Atoi(mux.Vars(req)["id"])
		if err != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		var x struct {
			Decision string `json:"decision"`
		}
		if json.NewDecoder(req.Body).Decode(&x) != nil || (x.Decision != "accept" && x.Decision != "reject") {
			out(w, 422, map[string]string{"error": "decision must be accept or reject"})
			return
		}
		status := "approved"
		if x.Decision == "accept" {
			status = "left"
		}
		tx, e := db.Begin()
		if e != nil {
			out(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer tx.Rollback()
		var studentID int
		e = tx.QueryRow(`UPDATE memberships SET status=$1,decided_at=NOW(),decided_by=$2 WHERE membership_id=$3 AND club_id=$4 AND status='leave_requested' RETURNING student_id`, status, uid, id, cid).Scan(&studentID)
		if e != nil {
			var foreign bool
			_ = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM memberships WHERE membership_id=$1 AND club_id<>$2)`, id, cid).Scan(&foreign)
			if foreign {
				out(w, 403, map[string]string{"error": "You can only manage leave requests for your own club"})
				return
			}
			out(w, 404, map[string]string{"error": "Leave request not found for your club"})
			return
		}
		var clubName string
		if e = tx.QueryRow(`SELECT name FROM clubs WHERE club_id=$1`, cid).Scan(&clubName); e != nil {
			out(w, 500, map[string]string{"error": "Could not load club"})
			return
		}
		title, message, kind := "Leave request rejected", "Your request to leave "+clubName+" was rejected. You remain a member.", "leave_rejected"
		if x.Decision == "accept" {
			title, message, kind = "Leave request accepted", "Your request to leave "+clubName+" was accepted. Your membership has ended.", "leave_accepted"
		}
		if _, e = tx.Exec(`INSERT INTO student_notifications(student_id,notification_type,title,message) VALUES($1,$2,$3,$4)`, studentID, kind, title, message); e != nil || tx.Commit() != nil {
			out(w, 500, map[string]string{"error": "Could not save the decision notification"})
			return
		}
		out(w, 200, map[string]string{"status": status})
	})).Methods("PUT")
	r.Handle("/api/coordinator/members/{id}", protect(coord, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		cid, err := coordinatorClub(uid)
		id, _ := strconv.Atoi(mux.Vars(req)["id"])
		if err != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		res, e := db.Exec(`UPDATE memberships SET status='removed',decided_at=NOW(),decided_by=$1 WHERE membership_id=$2 AND club_id=$3 AND status IN ('approved','leave_requested')`, uid, id, cid)
		n, _ := res.RowsAffected()
		if e != nil || n == 0 {
			var foreign bool
			_ = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM memberships WHERE membership_id=$1 AND club_id<>$2)`, id, cid).Scan(&foreign)
			if foreign {
				out(w, 403, map[string]string{"error": "You can only remove members from your own club"})
				return
			}
			out(w, 404, map[string]string{"error": "Member not found for your club"})
			return
		}
		out(w, 200, map[string]string{"status": "removed"})
	})).Methods("DELETE")
	r.Handle("/api/coordinator/announcements", protect(coord, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		cid, e := coordinatorClub(uid)
		if e != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		if req.Method == http.MethodGet {
			rows, err := db.Query(`SELECT announcement_id,title,category,body,created_at,updated_at FROM announcements WHERE club_id=$1 ORDER BY created_at DESC`, cid)
			if err != nil {
				out(w, 500, map[string]string{"error": "Could not load announcements"})
				return
			}
			defer rows.Close()
			items := []any{}
			for rows.Next() {
				var id int
				var title, category, body string
				var created, updated interface{}
				if rows.Scan(&id, &title, &category, &body, &created, &updated) == nil {
					items = append(items, map[string]any{"id": id, "title": title, "category": category, "body": body, "description": body, "created_at": created, "updated_at": updated})
				}
			}
			out(w, 200, items)
			return
		}
		var x struct {
			Title    string `json:"title"`
			Category string `json:"category"`
			Body     string `json:"body"`
		}
		if json.NewDecoder(req.Body).Decode(&x) != nil {
			out(w, 422, map[string]string{"error": "A title, valid category, and details are required"})
			return
		}
		x.Title, x.Category, x.Body = strings.TrimSpace(x.Title), strings.TrimSpace(x.Category), strings.TrimSpace(x.Body)
		if x.Title == "" || x.Body == "" || !validAnnouncementCategory(x.Category) || len(x.Title) > 200 || len(x.Body) > 20000 {
			out(w, 422, map[string]string{"error": "A title, valid category, and details are required"})
			return
		}
		var id int
		if db.QueryRow(`INSERT INTO announcements(club_id,created_by,title,category,body) VALUES($1,$2,$3,$4,$5) RETURNING announcement_id`, cid, uid, strings.TrimSpace(x.Title), x.Category, strings.TrimSpace(x.Body)).Scan(&id) != nil {
			out(w, 500, map[string]string{"error": "Could not create announcement"})
			return
		}
		out(w, 201, map[string]int{"id": id})
	})).Methods("GET", "POST")
	r.Handle("/api/coordinator/announcements/{id}", protect(coord, func(w http.ResponseWriter, req *http.Request) {
		uid, _ := utils.GetUserID(req.Context())
		cid, e := coordinatorClub(uid)
		id, _ := strconv.Atoi(mux.Vars(req)["id"])
		if e != nil {
			out(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		if req.Method == http.MethodDelete {
			res, err := db.Exec(`DELETE FROM announcements WHERE announcement_id=$1 AND club_id=$2`, id, cid)
			n, _ := res.RowsAffected()
			if err != nil || n == 0 {
				var foreign bool
				_ = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM announcements WHERE announcement_id=$1 AND club_id<>$2)`, id, cid).Scan(&foreign)
				if foreign {
					out(w, 403, map[string]string{"error": "You can only delete announcements for your own club"})
					return
				}
				out(w, 404, map[string]string{"error": "Announcement not found for your club"})
				return
			}
			out(w, 200, map[string]string{"message": "Announcement deleted"})
			return
		}
		var x struct {
			Title    string `json:"title"`
			Category string `json:"category"`
			Body     string `json:"body"`
		}
		if json.NewDecoder(req.Body).Decode(&x) != nil {
			out(w, 422, map[string]string{"error": "A title, valid category, and details are required"})
			return
		}
		x.Title, x.Category, x.Body = strings.TrimSpace(x.Title), strings.TrimSpace(x.Category), strings.TrimSpace(x.Body)
		if x.Title == "" || x.Body == "" || (x.Category != "" && !validAnnouncementCategory(x.Category)) || len(x.Title) > 200 || len(x.Body) > 20000 {
			out(w, 422, map[string]string{"error": "A title, valid category, and details are required"})
			return
		}
		res, err := db.Exec(`UPDATE announcements SET title=$1,category=COALESCE(NULLIF($2,''),category),body=$3,updated_at=NOW() WHERE announcement_id=$4 AND club_id=$5`, x.Title, x.Category, x.Body, id, cid)
		n, _ := res.RowsAffected()
		if err != nil || n == 0 {
			var foreign bool
			_ = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM announcements WHERE announcement_id=$1 AND club_id<>$2)`, id, cid).Scan(&foreign)
			if foreign {
				out(w, 403, map[string]string{"error": "You can only edit announcements for your own club"})
				return
			}
			out(w, 404, map[string]string{"error": "Announcement not found for your club"})
			return
		}
		out(w, 200, map[string]string{"message": "Announcement updated"})
	})).Methods("PUT", "DELETE")
}

func validAnnouncementCategory(category string) bool {
	switch category {
	case "Event", "Club", "Urgent", "General":
		return true
	default:
		return false
	}
}
