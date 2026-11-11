
package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"club-management-system/config"
	"club-management-system/utils"

	"github.com/joho/godotenv"
	"golang.org/x/term"
)

func main() {
	// Load environment variables
	if err := godotenv.Overload(".env"); err != nil {
		log.Fatal("Could not load .env file:", err)
	}

	// Check JWT secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET must contain at least 32 characters.")
	}

	// Connect to PostgreSQL
	db, err := config.ConnectDB()
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	// Check whether an admin already exists
	var adminCount int
	err = db.QueryRow(
		"SELECT COUNT(*) FROM users WHERE role = 'admin'",
	).Scan(&adminCount)

	if err != nil {
		log.Fatal("Could not check existing admins:", err)
	}

	if adminCount > 0 {
		log.Fatal("An admin account already exists. No new account was created.")
	}

	// Get admin details
	var fullName, email string

	fmt.Print("Enter admin full name: ")
	fmt.Scanln(&fullName)

	fmt.Print("Enter admin email: ")
	fmt.Scanln(&email)

	fullName = strings.TrimSpace(fullName)
	email = strings.ToLower(strings.TrimSpace(email))

	if fullName == "" || email == "" {
		log.Fatal("Name and email cannot be empty.")
	}

	// Read password without displaying it
	fmt.Print("Enter admin password: ")
	password, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println()

	if err != nil {
		log.Fatal("Could not read password:", err)
	}

	fmt.Print("Confirm admin password: ")
	confirmPassword, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println()

	if err != nil {
		log.Fatal("Could not read confirmation:", err)
	}

	if string(password) != string(confirmPassword) {
		log.Fatal("Passwords do not match.")
	}

	if len(password) < 8 {
		log.Fatal("Password must contain at least 8 characters.")
	}

	// Hash the password using bcrypt
	passwordHash, err := utils.HashPassword(string(password))
	if err != nil {
		log.Fatal("Could not hash password:", err)
	}

	// Insert the admin into PostgreSQL
	var userID int

	err = db.QueryRow(`
		INSERT INTO users
			(full_name, email, password_hash, role, is_active, must_change_password)
		VALUES
			($1, $2, $3, 'admin', TRUE, FALSE)
		RETURNING user_id
	`,
		fullName,
		email,
		passwordHash,
	).Scan(&userID)

	if err != nil {
		log.Fatal("Could not create admin account:", err)
	}

	fmt.Println("\nAdmin account created successfully!")
	fmt.Println("Admin ID:", userID)
	fmt.Println("Name:", fullName)
	fmt.Println("Email:", email)
	fmt.Println("Role: admin")
}
