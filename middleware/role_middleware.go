package middleware

import (
    "net/http"

	"club-management-system/utils"
)

func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

            // Get the user's role from the request context
            userRole, ok := utils.GetUserRole(r.Context())

            if !ok {
                http.Error(w, `{"error":"User role not found"}`, http.StatusUnauthorized)
                return
            }

            // Check whether the user's role is allowed
            for _, role := range allowedRoles {
                if userRole == role {
                    next.ServeHTTP(w, r)
                    return
                }
            }

            // Reject users with the wrong role
            http.Error(w, `{"error":"Access denied"}`, http.StatusForbidden)
        })
    }
}