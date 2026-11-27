package middleware

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"net/http"
	"os"
	"strings"

	"club-management-system/controllers"
	"club-management-system/utils"

	"github.com/golang-jwt/jwt/v5"
)

var revocationDB *sql.DB

func SetRevocationDB(db *sql.DB) { revocationDB = db }
func TokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie("club_auth"); err == nil && c.Value != "" {
		return c.Value
	}
	p := strings.SplitN(r.Header.Get("Authorization"), " ", 2)
	if len(p) == 2 && p[0] == "Bearer" {
		return strings.TrimSpace(p[1])
	}
	return ""
}
func TokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Prefer the shared HTTP-only session, falling back to the existing bearer token.
		tokenString := TokenFromRequest(r)
		if tokenString == "" {
			http.Error(w, `{"error":"Authentication required"}`, http.StatusUnauthorized)
			return
		}

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
		if revocationDB != nil {
			var revoked bool
			if err := revocationDB.QueryRow(`SELECT EXISTS(SELECT 1 FROM revoked_tokens WHERE token_hash=$1 AND expires_at>NOW())`, TokenHash(tokenString)).Scan(&revoked); err != nil || revoked {
				http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
				return
			}
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
		var exists bool
		if revocationDB == nil || revocationDB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE user_id=$1 AND role=$2 AND is_active=TRUE)`, claims.UserID, claims.Role).Scan(&exists) != nil || !exists {
			http.Error(w, `{"error":"Account is unavailable"}`, http.StatusUnauthorized)
			return
		}

		// Check whether the user must change their default password
		if claims.MustChangePassword && r.URL.Path != "/api/auth/change-password" && r.URL.Path != "/api/auth/me" {

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
