package utils

import "context"

type contextKey string

const (
    UserIDKey   contextKey = "user_id"
    UserRoleKey contextKey = "user_role"
)

func WithUserContext(ctx context.Context, userID int, role string) context.Context {
    ctx = context.WithValue(ctx, UserIDKey, userID)
    ctx = context.WithValue(ctx, UserRoleKey, role)
    return ctx
}

func GetUserID(ctx context.Context) (int, bool) {
    userID, ok := ctx.Value(UserIDKey).(int)
    return userID, ok
}

func GetUserRole(ctx context.Context) (string, bool) {
    role, ok := ctx.Value(UserRoleKey).(string)
    return role, ok
}