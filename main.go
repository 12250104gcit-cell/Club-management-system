package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"club-management-system/config"
	"club-management-system/routes"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {

	// Load environment variables
	err := godotenv.Overload(".env")
	if err != nil && !os.IsNotExist(err) {
		log.Fatal("Error loading .env file:", err)
	}

	// Connect to PostgreSQL
	db, err := config.ConnectDB()

	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()

	fmt.Println("Database connected successfully!")

	// Create router
	router := mux.NewRouter()

	// Register API routes
	if err := routes.RegisterRoutes(router, db); err != nil {
		log.Fatal("Could not initialize Sprint 1 schema:", err)
	}
	allowedOrigins := strings.Split(os.Getenv("CORS_ORIGINS"), ",")
	cors := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			originAllowed := false
			for _, allowedOrigin := range allowedOrigins {
				if origin != "" && strings.TrimSpace(allowedOrigin) == origin {
					originAllowed = true
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
					w.Header().Set("Access-Control-Allow-Credentials", "true")
					w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
					w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				}
			}
			if r.Method == http.MethodOptions {
				if origin != "" && !originAllowed {
					http.Error(w, "origin not allowed", http.StatusForbidden)
					return
				}
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	// Health check API
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		fmt.Fprintln(w, `{"message":"Club Management API is running!"}`)
	}).Methods("GET")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = os.Getenv("SERVER_PORT")
	}
	if port == "" {
		port = "4001"
	}

	fmt.Println("Server running on port", port)

	log.Fatal(http.ListenAndServe("0.0.0.0:"+port, cors(router)))
}
