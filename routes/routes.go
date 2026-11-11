package routes

import (
    "database/sql"
    "net/http"

    "club-management-system/controllers"
    "club-management-system/middleware"

    "github.com/gorilla/mux"
)

func RegisterRoutes(router *mux.Router, db *sql.DB) {

    authController := controllers.AuthController{DB: db}

    // Public route: Login
    router.HandleFunc(
        "/api/auth/login",
        authController.Login,
    ).Methods("POST")

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
}