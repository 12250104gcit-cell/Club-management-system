package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"club-management-system/config"
	"club-management-system/controllers"
	"club-management-system/middleware"
	"club-management-system/utils"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

func RegisterRoutes(router *mux.Router, db *sql.DB) error {
	if err := config.EnsureSchema(db); err != nil {
		return err
	}
	middleware.SetRevocationDB(db)

	authController := controllers.AuthController{DB: db}

	// Public route: Login
	router.HandleFunc(
		"/api/auth/login",
		authController.Login,
	).Methods("POST")
	router.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		var x struct {
			FullName string `json:"full_name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.FullName) == "" || !strings.Contains(x.Email, "@") || len(x.Password) < 8 {
			writeJSON(w, 422, map[string]string{"error": "Name, valid email and password of at least 8 characters are required"})
			return
		}
		hash, e := bcrypt.GenerateFromPassword([]byte(x.Password), bcrypt.DefaultCost)
		if e != nil {
			writeJSON(w, 500, map[string]string{"error": "Could not secure password"})
			return
		}
		_, e = db.Exec(`INSERT INTO users(full_name,email,password_hash,role,is_active,must_change_password) VALUES($1,LOWER($2),$3,'student',TRUE,FALSE)`, strings.TrimSpace(x.FullName), strings.TrimSpace(x.Email), string(hash))
		if e != nil {
			writeJSON(w, 409, map[string]string{"error": "Email is already registered"})
			return
		}
		writeJSON(w, 201, map[string]string{"message": "Student account created"})
	}).Methods("POST")

	jsonOut := func(w http.ResponseWriter, code int, v any) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(code)
		_ = json.NewEncoder(w).Encode(v)
	}
	protect := func(roles []string, fn http.HandlerFunc) http.Handler {
		var h http.Handler = fn
		if len(roles) > 0 {
			h = middleware.RequireRole(roles...)(h)
		}
		return middleware.AuthMiddleware(h)
	}
	router.Handle("/api/auth/me", middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid, ok := utils.GetUserID(r.Context())
		if !ok {
			jsonOut(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
			return
		}
		var name, email, role string
		var mustChange bool
		if err := db.QueryRow(`SELECT full_name,email,role,must_change_password FROM users WHERE user_id=$1 AND is_active=TRUE`, uid).Scan(&name, &email, &role, &mustChange); err != nil {
			jsonOut(w, http.StatusUnauthorized, map[string]string{"error": "Account is unavailable"})
			return
		}
		jsonOut(w, http.StatusOK, map[string]any{"user_id": uid, "full_name": name, "email": email, "role": role, "must_change_password": mustChange})
	}))).Methods("GET")
	router.Handle("/api/auth/profile", middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uid, ok := utils.GetUserID(r.Context())
		if !ok {
			jsonOut(w, http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
			return
		}
		type profile struct {
			UserID        int    `json:"user_id"`
			FullName      string `json:"full_name"`
			Email         string `json:"email"`
			Role          string `json:"role"`
			DateOfBirth   string `json:"date_of_birth"`
			Gender        string `json:"gender"`
			Programme     string `json:"programme"`
			Module        string `json:"module"`
			YearSemester  string `json:"year_semester"`
			EnrollmentNo  string `json:"enrollment_number"`
			EnrolmentYear string `json:"enrolment_year"`
			Phone         string `json:"phone"`
		}
		if r.Method == http.MethodGet {
			var p profile
			err := db.QueryRow(`SELECT user_id,full_name,email,role,date_of_birth,gender,programme,module,year_semester,enrollment_number,enrolment_year,phone FROM users WHERE user_id=$1 AND is_active=TRUE`, uid).Scan(&p.UserID, &p.FullName, &p.Email, &p.Role, &p.DateOfBirth, &p.Gender, &p.Programme, &p.Module, &p.YearSemester, &p.EnrollmentNo, &p.EnrolmentYear, &p.Phone)
			if err != nil {
				jsonOut(w, http.StatusNotFound, map[string]string{"error": "Profile not found"})
				return
			}
			jsonOut(w, http.StatusOK, p)
			return
		}
		var p profile
		if json.NewDecoder(r.Body).Decode(&p) != nil {
			jsonOut(w, http.StatusBadRequest, map[string]string{"error": "Invalid profile data"})
			return
		}
		p.FullName = strings.TrimSpace(p.FullName)
		p.Email = strings.ToLower(strings.TrimSpace(p.Email))
		if p.FullName == "" || !strings.Contains(p.Email, "@") || len(p.FullName) > 160 || len(p.Email) > 254 {
			jsonOut(w, http.StatusUnprocessableEntity, map[string]string{"error": "Name and valid email are required"})
			return
		}
		if p.DateOfBirth != "" {
			if _, err := time.Parse("2006-01-02", p.DateOfBirth); err != nil {
				jsonOut(w, http.StatusUnprocessableEntity, map[string]string{"error": "Date of birth must be a valid date"})
				return
			}
		}
		fields := []string{p.Gender, p.Programme, p.Module, p.YearSemester, p.EnrollmentNo, p.EnrolmentYear, p.Phone}
		for _, field := range fields {
			if len(field) > 160 {
				jsonOut(w, http.StatusUnprocessableEntity, map[string]string{"error": "Profile fields must be 160 characters or fewer"})
				return
			}
		}
		var duplicate bool
		if err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email)=$1 AND user_id<>$2)`, p.Email, uid).Scan(&duplicate); err != nil {
			jsonOut(w, http.StatusInternalServerError, map[string]string{"error": "Could not check email address"})
			return
		}
		if duplicate {
			jsonOut(w, http.StatusConflict, map[string]string{"error": "Email is already in use"})
			return
		}
		res, err := db.Exec(`UPDATE users SET full_name=$1,email=$2,date_of_birth=$3,gender=$4,programme=$5,module=$6,year_semester=$7,enrollment_number=$8,enrolment_year=$9,phone=$10,updated_at=NOW() WHERE user_id=$11 AND is_active=TRUE`, p.FullName, p.Email, p.DateOfBirth, strings.TrimSpace(p.Gender), strings.TrimSpace(p.Programme), strings.TrimSpace(p.Module), strings.TrimSpace(p.YearSemester), strings.TrimSpace(p.EnrollmentNo), strings.TrimSpace(p.EnrolmentYear), strings.TrimSpace(p.Phone), uid)
		if err != nil {
			jsonOut(w, http.StatusInternalServerError, map[string]string{"error": "Could not save profile"})
			return
		}
		if count, _ := res.RowsAffected(); count == 0 {
			jsonOut(w, http.StatusNotFound, map[string]string{"error": "Profile not found"})
			return
		}
		p.UserID = uid
		if err := db.QueryRow(`SELECT role FROM users WHERE user_id=$1`, uid).Scan(&p.Role); err != nil {
			jsonOut(w, http.StatusInternalServerError, map[string]string{"error": "Could not load profile"})
			return
		}
		jsonOut(w, http.StatusOK, p)
	}))).Methods("GET", "PUT")
	router.Handle("/api/auth/logout", middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := middleware.TokenFromRequest(r)
		if _, err := db.Exec(`INSERT INTO revoked_tokens(token_hash,expires_at) VALUES($1,NOW()+INTERVAL '24 hours') ON CONFLICT(token_hash) DO NOTHING`, middleware.TokenHash(token)); err != nil {
			jsonOut(w, http.StatusInternalServerError, map[string]string{"error": "Could not end session"})
			return
		}
		http.SetCookie(w, &http.Cookie{Name: "club_auth", Value: "", Path: "/", HttpOnly: true, Secure: r.TLS != nil, SameSite: http.SameSiteLaxMode, MaxAge: -1, Expires: time.Unix(0, 0)})
		jsonOut(w, http.StatusOK, map[string]string{"message": "Logged out"})
	}))).Methods("POST")
	admin := []string{"admin"}
	student := []string{"student"}
	coord := []string{"coordinator"}
	router.Handle("/api/clubs", protect([]string{"admin", "student"}, func(w http.ResponseWriter, r *http.Request) {
		rows, e := db.Query(`SELECT c.club_id,c.name,c.description,c.category,c.coordinator_id,COALESCE(u.full_name,''), (SELECT COUNT(*) FROM memberships m WHERE m.club_id=c.club_id AND m.status='approved') FROM clubs c LEFT JOIN users u ON u.user_id=c.coordinator_id ORDER BY c.name`)
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer rows.Close()
		out := []any{}
		for rows.Next() {
			var id int
			var name, desc, category, coName string
			var coID sql.NullInt64
			var n int
			if rows.Scan(&id, &name, &desc, &category, &coID, &coName, &n) == nil {
				out = append(out, map[string]any{"id": id, "name": name, "description": desc, "category": category, "coordinator_id": coID, "coordinator_name": coName, "members": n})
			}
		}
		jsonOut(w, 200, out)
	})).Methods("GET")
	router.Handle("/api/clubs", protect(admin, func(w http.ResponseWriter, r *http.Request) {
		var x struct {
			Name          string `json:"name"`
			Description   string `json:"description"`
			Category      string `json:"category"`
			CoordinatorID int    `json:"coordinator_id"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.Name) == "" {
			jsonOut(w, 422, map[string]string{"error": "Club name is required"})
			return
		}
		var id int
		e := db.QueryRow(`INSERT INTO clubs(name,description,category) VALUES($1,$2,$3) RETURNING club_id`, strings.TrimSpace(x.Name), strings.TrimSpace(x.Description), strings.TrimSpace(x.Category)).Scan(&id)
		if e != nil {
			jsonOut(w, 409, map[string]string{"error": "Club name already exists"})
			return
		}
		if x.CoordinatorID > 0 {
			res, err := db.Exec(`UPDATE clubs SET coordinator_id=$1 WHERE club_id=$2 AND EXISTS(SELECT 1 FROM users WHERE user_id=$1 AND role='coordinator')`, x.CoordinatorID, id)
			n := int64(0)
			if err == nil {
				n, _ = res.RowsAffected()
			}
			if err != nil || n == 0 {
				_, _ = db.Exec(`DELETE FROM clubs WHERE club_id=$1`, id)
				jsonOut(w, 409, map[string]string{"error": "Coordinator is unavailable or already assigned"})
				return
			}
		}
		jsonOut(w, 201, map[string]int{"id": id})
	})).Methods("POST")
	router.Handle("/api/clubs/{id}", protect(admin, func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		if r.Method == http.MethodDelete {
			res, e := db.Exec(`DELETE FROM clubs WHERE club_id=$1`, id)
			n, _ := res.RowsAffected()
			if e != nil || n == 0 {
				jsonOut(w, 404, map[string]string{"error": "Club not found"})
				return
			}
			jsonOut(w, 200, map[string]string{"message": "Club deleted"})
			return
		}
		var x struct {
			Name          string `json:"name"`
			Description   string `json:"description"`
			Category      string `json:"category"`
			CoordinatorID int    `json:"coordinator_id"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.Name) == "" {
			jsonOut(w, 422, map[string]string{"error": "Club name is required"})
			return
		}
		var res sql.Result
		res, err := db.Exec(`UPDATE clubs SET name=$1,description=$2,category=$3,coordinator_id=NULLIF($4,0) WHERE club_id=$5 AND ($4=0 OR EXISTS(SELECT 1 FROM users WHERE user_id=$4 AND role='coordinator'))`, strings.TrimSpace(x.Name), strings.TrimSpace(x.Description), strings.TrimSpace(x.Category), x.CoordinatorID, id)
		n := int64(0)
		if err == nil {
			n, _ = res.RowsAffected()
		}
		if err != nil || n == 0 {
			jsonOut(w, 404, map[string]string{"error": "Club not found or name unavailable"})
			return
		}
		jsonOut(w, 200, map[string]string{"message": "Club updated"})
	})).Methods("PUT", "DELETE")
	router.Handle("/api/student/requests", protect(student, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		if r.Method == http.MethodGet {
			rows, e := db.Query(`SELECT m.membership_id,m.club_id,c.name,m.status FROM memberships m JOIN clubs c USING(club_id) WHERE m.student_id=$1 ORDER BY m.created_at DESC`, uid)
			if e != nil {
				jsonOut(w, 500, map[string]string{"error": "Database error"})
				return
			}
			defer rows.Close()
			out := []any{}
			for rows.Next() {
				var mid, cid int
				var name, status string
				if rows.Scan(&mid, &cid, &name, &status) == nil {
					out = append(out, map[string]any{"id": mid, "club_id": cid, "club_name": name, "status": status})
				}
			}
			jsonOut(w, 200, out)
			return
		}
		var x struct {
			ClubID int `json:"club_id"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || x.ClubID <= 0 {
			jsonOut(w, 422, map[string]string{"error": "club_id is required"})
			return
		}
		var id int
		e := db.QueryRow(`INSERT INTO memberships(student_id,club_id,status) VALUES($1,$2,'pending') RETURNING membership_id`, uid, x.ClubID).Scan(&id)
		if e != nil {
			jsonOut(w, 409, map[string]string{"error": "Leave your current club before joining another"})
			return
		}
		jsonOut(w, 201, map[string]int{"id": id})
	})).Methods("GET", "POST")
	coordinatorClub := func(uid int) (int, error) {
		var id int
		err := db.QueryRow(`SELECT club_id FROM clubs WHERE coordinator_id=$1`, uid).Scan(&id)
		return id, err
	}
	registerPollRoutes(router, db, protect, coordinatorClub, jsonOut)
	router.Handle("/api/coordinator/requests", protect(coord, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		cid, e := coordinatorClub(uid)
		if e != nil {
			jsonOut(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		rows, e := db.Query(`SELECT m.membership_id,u.full_name,u.email,m.status FROM memberships m JOIN users u ON u.user_id=m.student_id WHERE m.club_id=$1 ORDER BY m.created_at DESC`, cid)
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer rows.Close()
		out := []any{}
		for rows.Next() {
			var id int
			var name, email, status string
			if rows.Scan(&id, &name, &email, &status) == nil {
				out = append(out, map[string]any{"id": id, "name": name, "email": email, "status": strings.Title(status)})
			}
		}
		jsonOut(w, 200, out)
	})).Methods("GET")
	router.Handle("/api/coordinator/requests/{id}", protect(coord, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		cid, e := coordinatorClub(uid)
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		var x struct {
			Status string `json:"status"`
		}
		if e != nil || json.NewDecoder(r.Body).Decode(&x) != nil || (x.Status != "approved" && x.Status != "rejected") {
			jsonOut(w, 422, map[string]string{"error": "status must be approved or rejected"})
			return
		}
		res, e := db.Exec(`UPDATE memberships SET status=$1,decided_at=NOW(),decided_by=$2 WHERE membership_id=$3 AND club_id=$4 AND status='pending'`, x.Status, uid, id, cid)
		n, _ := res.RowsAffected()
		if e != nil || n == 0 {
			jsonOut(w, 404, map[string]string{"error": "Pending request not found for your club"})
			return
		}
		jsonOut(w, 200, map[string]string{"status": x.Status})
	})).Methods("PUT")
	router.Handle("/api/coordinator/members", protect(coord, func(w http.ResponseWriter, r *http.Request) {
		uid, _ := utils.GetUserID(r.Context())
		cid, e := coordinatorClub(uid)
		if e != nil {
			jsonOut(w, 404, map[string]string{"error": "No club assigned"})
			return
		}
		rows, e := db.Query(`SELECT u.user_id,u.full_name,u.email FROM memberships m JOIN users u ON u.user_id=m.student_id WHERE m.club_id=$1 AND m.status='approved' ORDER BY u.full_name`, cid)
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer rows.Close()
		out := []any{}
		for rows.Next() {
			var id int
			var name, email string
			if rows.Scan(&id, &name, &email) == nil {
				out = append(out, map[string]any{"id": id, "name": name, "email": email})
			}
		}
		jsonOut(w, 200, out)
	})).Methods("GET")
	router.Handle("/api/admin/clubs/{id}/members", protect(admin, func(w http.ResponseWriter, r *http.Request) {
		cid, _ := strconv.Atoi(mux.Vars(r)["id"])
		rows, e := db.Query(`SELECT u.user_id,u.full_name,u.email FROM memberships m JOIN users u ON u.user_id=m.student_id WHERE m.club_id=$1 AND m.status='approved' ORDER BY u.full_name`, cid)
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer rows.Close()
		out := []any{}
		for rows.Next() {
			var id int
			var name, email string
			if rows.Scan(&id, &name, &email) == nil {
				out = append(out, map[string]any{"id": id, "name": name, "email": email})
			}
		}
		jsonOut(w, 200, out)
	})).Methods("GET")
	router.Handle("/api/admin/coordinators", protect(admin, func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			rows, e := db.Query(`SELECT u.user_id,u.full_name,u.email,c.club_id,c.name FROM users u LEFT JOIN clubs c ON c.coordinator_id=u.user_id WHERE u.role='coordinator' ORDER BY u.full_name`)
			if e != nil {
				jsonOut(w, 500, map[string]string{"error": "Database error"})
				return
			}
			defer rows.Close()
			out := []any{}
			for rows.Next() {
				var id int
				var name, email string
				var cid sql.NullInt64
				var cname sql.NullString
				if rows.Scan(&id, &name, &email, &cid, &cname) == nil {
					out = append(out, map[string]any{"id": id, "name": name, "email": email, "club_id": cid, "club_name": cname, "status": "Active"})
				}
			}
			jsonOut(w, 200, out)
			return
		}
		var x struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
			ClubID   int    `json:"club_id"`
		}
		if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.Name) == "" || !strings.Contains(x.Email, "@") || len(x.Password) < 8 || x.ClubID < 1 {
			jsonOut(w, 422, map[string]string{"error": "Name, valid email, password (8+ chars), and club are required"})
			return
		}
		hash, e := bcrypt.GenerateFromPassword([]byte(x.Password), bcrypt.DefaultCost)
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not secure password"})
			return
		}
		tx, e := db.Begin()
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer tx.Rollback()
		var uid int
		e = tx.QueryRow(`INSERT INTO users(full_name,email,password_hash,role,is_active,must_change_password) VALUES($1,LOWER($2),$3,'coordinator',TRUE,FALSE) RETURNING user_id`, strings.TrimSpace(x.Name), strings.TrimSpace(x.Email), string(hash)).Scan(&uid)
		if e == nil {
			var res sql.Result
			res, e = tx.Exec(`UPDATE clubs SET coordinator_id=$1 WHERE club_id=$2 AND (coordinator_id IS NULL OR coordinator_id=$1)`, uid, x.ClubID)
			var n int64
			if e == nil {
				n, _ = res.RowsAffected()
				if n == 0 {
					e = sql.ErrNoRows
				}
			}
		}
		if e != nil {
			jsonOut(w, 409, map[string]string{"error": "Email is in use, club is missing, or club already has a coordinator"})
			return
		}
		if tx.Commit() != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not save coordinator"})
			return
		}
		jsonOut(w, 201, map[string]int{"id": uid})
	})).Methods("GET", "POST")
	router.Handle("/api/admin/coordinators/{id}", protect(admin, func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(mux.Vars(r)["id"])
		if r.Method == http.MethodPut {
			var x struct {
				Name   string `json:"name"`
				Email  string `json:"email"`
				ClubID int    `json:"club_id"`
			}
			if json.NewDecoder(r.Body).Decode(&x) != nil || strings.TrimSpace(x.Name) == "" || !strings.Contains(x.Email, "@") || x.ClubID < 1 {
				jsonOut(w, 422, map[string]string{"error": "Name, valid email and assigned club are required"})
				return
			}
			tx, e := db.Begin()
			if e != nil {
				jsonOut(w, 500, map[string]string{"error": "Database error"})
				return
			}
			defer tx.Rollback()
			_, e = tx.Exec(`UPDATE users SET full_name=$1,email=LOWER($2),updated_at=NOW() WHERE user_id=$3 AND role='coordinator'`, strings.TrimSpace(x.Name), strings.TrimSpace(x.Email), id)
			if e == nil {
				_, e = tx.Exec(`UPDATE clubs SET coordinator_id=NULL WHERE coordinator_id=$1`, id)
			}
			if e == nil {
				var res sql.Result
				res, e = tx.Exec(`UPDATE clubs SET coordinator_id=$1 WHERE club_id=$2 AND coordinator_id IS NULL`, id, x.ClubID)
				var n int64
				if e == nil {
					n, _ = res.RowsAffected()
					if n == 0 {
						e = sql.ErrNoRows
					}
				}
			}
			if e != nil {
				jsonOut(w, 409, map[string]string{"error": "Email is in use, club is missing, or club already has a coordinator"})
				return
			}
			if tx.Commit() != nil {
				jsonOut(w, 500, map[string]string{"error": "Could not save coordinator"})
				return
			}
			jsonOut(w, 200, map[string]string{"message": "Coordinator updated"})
			return
		}
		tx, e := db.Begin()
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Database error"})
			return
		}
		defer tx.Rollback()
		// Remove the club reference first so assigned coordinators can be deleted
		// even when the schema enforces the coordinator foreign key.
		if _, e = tx.Exec(`UPDATE clubs SET coordinator_id=NULL WHERE coordinator_id=$1`, id); e != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not unassign coordinator"})
			return
		}
		if _, e = tx.Exec(`UPDATE memberships SET decided_by=NULL WHERE decided_by=$1`, id); e != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not clear coordinator decision references"})
			return
		}
		res, e := tx.Exec(`DELETE FROM users WHERE user_id=$1 AND role='coordinator'`, id)
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not delete coordinator"})
			return
		}
		n, e := res.RowsAffected()
		if e != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not verify coordinator deletion"})
			return
		}
		if n == 0 {
			jsonOut(w, 404, map[string]string{"error": "Coordinator not found"})
			return
		}
		if tx.Commit() != nil {
			jsonOut(w, 500, map[string]string{"error": "Could not save coordinator deletion"})
			return
		}
		jsonOut(w, 200, map[string]string{"message": "Coordinator deleted"})
	})).Methods("PUT", "DELETE")

	// Change password (requires authentication)
	router.Handle(
		"/api/auth/change-password",
		middleware.AuthMiddleware(
			http.HandlerFunc(authController.ChangePassword),
		),
	).Methods("PUT")

	// Protected admin test route
	router.Handle(
		"/api/admin/test",
		middleware.AuthMiddleware(
			middleware.RequireRole("admin")(
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"message":"Welcome Admin! Access granted."}`))
				}),
			),
		),
	).Methods("GET")
	return nil
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
