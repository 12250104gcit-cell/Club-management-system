package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"club-management-system/config"
	"club-management-system/routes"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {

	// Load environment variables
	err := godotenv.Overload(".env")

	if err != nil {
		log.Fatal("Error loading .env file:", err)
	}

	fmt.Println("DB_HOST loaded:", os.Getenv("DB_HOST"))

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
	routes.RegisterRoutes(router, db)

	// Health check API
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		fmt.Fprintln(w, `{"message":"Club Management API is running!"}`)
	}).Methods("GET")

	// Start server
	port := os.Getenv("SERVER_PORT")

	fmt.Println("Server running on port", port)

	log.Fatal(http.ListenAndServe(":"+port, router))
}
