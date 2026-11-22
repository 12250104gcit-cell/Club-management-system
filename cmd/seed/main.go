package main

import (
	"fmt"
	"log"
	"os"

	"club-management-system/config"
	"club-management-system/utils"
	"github.com/joho/godotenv"
)

type account struct{ name, email, password, role string }

func main() {
	if err := godotenv.Overload(".env"); err != nil {
		log.Fatal("Load .env: ", err)
	}
	db, err := config.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err = config.EnsureSchema(db); err != nil {
		log.Fatal("Initialize schema: ", err)
	}
	password := os.Getenv("SEED_PASSWORD")
	if len(password) < 8 {
		log.Fatal("Set SEED_PASSWORD in .env (minimum 8 characters)")
	}
	accounts := []account{
		{"GCIT Admin", "admin@gcit.bt", password, "admin"},
		{"Pema Lhamo", "pema.student@gcit.bt", password, "student"},
		{"Tshering Dorji", "tshering.student@gcit.bt", password, "student"},
		{"Kinzang Dorji", "kinzang.student@gcit.bt", password, "student"},
	}
	for _, a := range accounts {
		hash, e := utils.HashPassword(a.password)
		if e != nil {
			log.Fatal(e)
		}
		_, e = db.Exec(`INSERT INTO users(full_name,email,password_hash,role,is_active,must_change_password) VALUES($1,$2,$3,$4,TRUE,FALSE) ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name,password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,is_active=TRUE,must_change_password=FALSE,updated_at=NOW()`, a.name, a.email, hash, a.role)
		if e != nil {
			log.Fatal("Seed account ", a.email, ": ", e)
		}
	}
	// Keep older development databases aligned with the current public club names.
	_, err = db.Exec(`UPDATE clubs SET name='Tarayana' WHERE name='Tarayana Club' AND NOT EXISTS(SELECT 1 FROM clubs WHERE name='Tarayana')`)
	if err != nil {
		log.Fatal("Rename Tarayana club: ", err)
	}
	_, err = db.Exec(`UPDATE clubs SET name='Start-Up Agency' WHERE name='Start-up agency' AND NOT EXISTS(SELECT 1 FROM clubs WHERE name='Start-Up Agency')`)
	if err != nil {
		log.Fatal("Rename Start-Up Agency: ", err)
	}
	clubs := []struct{ name, category, description string }{
		{"Coding Club", "Technology", "Programming, web development and technology projects."},
		{"Integrity Club", "Integrity", "Promoting honesty, ethics and accountability on campus."},
		{"Literary & Interactive Arts", "Arts", "Music, dance, theatre, creative writing and digital content."},
		{"Tarayana", "", "Volunteer service uplifting rural communities through outreach, fundraising and tutoring."},
		{"Media Marketing and Design", "", "Runs real marketing campaigns and builds content with the student services office."},
		{"Rovers", "", "Scouting for volunteering, conservation, disaster relief, and cultural preservation."},
		{"Start-Up Agency", "", "A student led agency delivering real software and UI/UX projects for clients."},
	}
	for _, c := range clubs {
		_, e := db.Exec(`INSERT INTO clubs(name,category,description) VALUES($1,$2,$3) ON CONFLICT(name) DO UPDATE SET category=EXCLUDED.category,description=EXCLUDED.description`, c.name, c.category, c.description)
		if e != nil {
			log.Fatal("Seed club ", c.name, ": ", e)
		}
	}
	var n int
	if e := db.QueryRow(`SELECT COUNT(*) FROM clubs`).Scan(&n); e != nil {
		log.Fatal(e)
	}
	if _, err = db.Exec(`INSERT INTO memberships(student_id,club_id,status) SELECT u.user_id,c.club_id,'approved' FROM users u CROSS JOIN clubs c WHERE u.email='pema.student@gcit.bt' AND c.name='Coding Club' AND NOT EXISTS(SELECT 1 FROM memberships m WHERE m.student_id=u.user_id AND m.status IN ('pending','approved'))`); err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec(`INSERT INTO polls(club_id,created_by,question,description,closes_at)
		SELECT c.club_id,a.user_id,'Which club activity should we plan next?','Choose an activity for the next club meet-up.',NOW()+INTERVAL '30 days'
		FROM clubs c CROSS JOIN users a WHERE c.name='Coding Club' AND a.email='admin@gcit.bt'
		AND NOT EXISTS(SELECT 1 FROM polls p WHERE p.question='Which club activity should we plan next?')`)
	if err != nil {
		log.Fatal("Seed open poll: ", err)
	}
	_, err = db.Exec(`INSERT INTO poll_options(poll_id,text) SELECT p.poll_id,o.text FROM polls p CROSS JOIN (VALUES('Workshop'),('Outdoor activity'),('Guest speaker')) o(text)
		WHERE p.question='Which club activity should we plan next?' AND NOT EXISTS(SELECT 1 FROM poll_options x WHERE x.poll_id=p.poll_id)`)
	if err != nil {
		log.Fatal("Seed open poll options: ", err)
	}
	_, err = db.Exec(`INSERT INTO polls(club_id,created_by,question,description,closes_at)
		SELECT c.club_id,a.user_id,'Sample closed poll','A poll used to demonstrate closed results.',NOW()-INTERVAL '1 day'
		FROM clubs c CROSS JOIN users a WHERE c.name='Coding Club' AND a.email='admin@gcit.bt'
		AND NOT EXISTS(SELECT 1 FROM polls p WHERE p.question='Sample closed poll')`)
	if err != nil {
		log.Fatal("Seed closed poll: ", err)
	}
	_, err = db.Exec(`INSERT INTO poll_options(poll_id,text) SELECT p.poll_id,o.text FROM polls p CROSS JOIN (VALUES('Option A'),('Option B')) o(text)
		WHERE p.question='Sample closed poll' AND NOT EXISTS(SELECT 1 FROM poll_options x WHERE x.poll_id=p.poll_id)`)
	if err != nil {
		log.Fatal("Seed closed poll options: ", err)
	}
	fmt.Printf("Seed complete: %d clubs and %d accounts. Use SEED_PASSWORD from .env for all accounts.\n", n, len(accounts))
	for _, a := range accounts {
		fmt.Printf("%-13s %s\n", a.role, a.email)
	}
}
