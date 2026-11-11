
package middleware

import (
	"net/http"
	"os"
	"strings"

	"club-management-system/controllers"
	"club-management-system/utils"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")

		if authHeader == "" {
			http.Error(w, `{"error":"Authorization token required"}`, http.StatusUnauthorized)
			return
		}

		// Check Bearer token format
		parts := strings.SplitN(authHeader, " ", 2)

		if len(parts) != 2 || parts[0] != "Bearer" || strings.TrimSpace(parts[1]) == "" {
			http.Error(w, `{"error":"Invalid authorization format"}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimSpace(parts[1])

		// Get JWT secret
		secret := os.Getenv("JWT_SECRET")

		if len(secret) < 32 {
			http.Error(w, `{"error":"JWT secret configuration error"}`, http.StatusInternalServerError)
			return
		}

		// Parse and validate JWT
		token, err := jwt.ParseWithClaims(
			tokenString,
			&controllers.Claims{},
			func(token *jwt.Token) (interface{}, error) {

				// Only allow HS256 signing method
				if token.Method != jwt.SigningMethodHS256 {
					return nil, jwt.ErrSignatureInvalid
				}

				return []byte(secret), nil
			},
		)

		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(*controllers.Claims)

		if !ok {
			http.Error(w, `{"error":"Invalid token claims"}`, http.StatusUnauthorized)
			return
		}

		// Check user ID and role
		if claims.UserID <= 0 ||
			(claims.Role != "admin" &&
				claims.Role != "coordinator" &&
				claims.Role != "student") {
			http.Error(w, `{"error":"Invalid user information in token"}`, http.StatusUnauthorized)
			return
		}

		// Check whether the user must change their default password
		if claims.MustChangePassword && r.URL.Path != "/api/auth/change-password" {

    		w.Header().Set("Content-Type", "application/json")
    		w.WriteHeader(http.StatusForbidden)

    		w.Write([]byte(`{
        		"error": "You must change your password before accessing other features",
        		"code": "PASSWORD_CHANGE_REQUIRED"
    		}`))

   			 return
		}

		// Store user information in request context
		ctx := utils.WithUserContext(
    		r.Context(),
    		claims.UserID,
    		claims.Role,
		)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}