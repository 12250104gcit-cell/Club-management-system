package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"club-management-system/models"
	"club-management-system/utils"
	"github.com/golang-jwt/jwt/v5"
)

type AuthController struct {
	DB *sql.DB
}

type Claims struct {
    UserID             int    `json:"user_id"`
    Role               string `json:"role"`
    MustChangePassword bool   `json:"must_change_password"`
    jwt.RegisteredClaims
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (ac *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	request.Email = strings.ToLower(strings.TrimSpace(request.Email))

	if request.Email == "" || request.Password == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Email and password are required",
		})
		return
	}

	var user models.User

	err = ac.DB.QueryRow(`
		SELECT user_id, full_name, email, password_hash,
		       role, is_active, must_change_password,
		       created_at, updated_at
		FROM users
		WHERE LOWER(email) = $1
	`, request.Email).Scan(
		&user.UserID,
		&user.FullName,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.IsActive,
		&user.MustChangePassword,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		respondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Invalid email or password",
		})
		return
	}

	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Database error",
		})
		return
	}

	if !user.IsActive {
		respondJSON(w, http.StatusForbidden, map[string]string{
			"error": "Account is inactive",
		})
		return
	}

	if !utils.CheckPassword(request.Password, user.PasswordHash) {
		respondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Invalid email or password",
		})
		return
	}

	secret := os.Getenv("JWT_SECRET")

	if len(secret) < 32 {
		respondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "JWT secret is not configured correctly",
		})
		return
	}

	claims := Claims{
    	UserID:             user.UserID,
    	Role:               user.Role,
    	MustChangePassword: user.MustChangePassword,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.Email,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not generate token",
		})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Login successful",
		"token":   tokenString,
		"user": map[string]interface{}{
			"user_id":              user.UserID,
			"full_name":            user.FullName,
			"email":                user.Email,
			"role":                 user.Role,
			"must_change_password": user.MustChangePassword,
		},
	})
}

func (ac *AuthController) ChangePassword(w http.ResponseWriter, r *http.Request) {

    // Get the logged-in user's ID from the request context
    userID, ok := utils.GetUserID(r.Context())

    if !ok {
        respondJSON(w, http.StatusUnauthorized, map[string]string{
            "error": "User not authenticated",
        })
        return
    }

    // Receive the current and new passwords
    var request struct {
        CurrentPassword string `json:"current_password"`
        NewPassword     string `json:"new_password"`
    }

    err := json.NewDecoder(r.Body).Decode(&request)

    if err != nil {
        respondJSON(w, http.StatusBadRequest, map[string]string{
            "error": "Invalid request body",
        })
        return
    }

    if request.CurrentPassword == "" || request.NewPassword == "" {
        respondJSON(w, http.StatusBadRequest, map[string]string{
            "error": "Both passwords are required",
        })
        return
    }

    if len(request.NewPassword) < 8 {
        respondJSON(w, http.StatusBadRequest, map[string]string{
            "error": "New password must contain at least 8 characters",
        })
        return
    }

    // Get the user's current password hash and account status
    var currentHash string
    var isActive bool

    err = ac.DB.QueryRow(`
        SELECT password_hash, is_active
        FROM users
        WHERE user_id = $1
    `, userID).Scan(&currentHash, &isActive)

    if err == sql.ErrNoRows {
        respondJSON(w, http.StatusNotFound, map[string]string{
            "error": "User not found",
        })
        return
    }

    if err != nil {
        respondJSON(w, http.StatusInternalServerError, map[string]string{
            "error": "Database error",
        })
        return
    }

    if !isActive {
        respondJSON(w, http.StatusForbidden, map[string]string{
            "error": "Account is inactive",
        })
        return
    }

    // Verify the current password
    if !utils.CheckPassword(request.CurrentPassword, currentHash) {
        respondJSON(w, http.StatusUnauthorized, map[string]string{
            "error": "Current password is incorrect",
        })
        return
    }

    // Hash the new password
    newHash, err := utils.HashPassword(request.NewPassword)

    if err != nil {
        respondJSON(w, http.StatusInternalServerError, map[string]string{
            "error": "Could not secure the new password",
        })
        return
    }

    // Update the password in the database
    _, err = ac.DB.Exec(`
        UPDATE users
        SET password_hash = $1,
            must_change_password = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
    `, newHash, userID)

    if err != nil {
        respondJSON(w, http.StatusInternalServerError, map[string]string{
            "error": "Could not update password",
        })
        return
    }

    respondJSON(w, http.StatusOK, map[string]string{
        "message": "Password changed successfully",
    })
}