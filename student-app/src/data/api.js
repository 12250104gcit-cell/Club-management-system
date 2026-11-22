import { getAuthToken } from "./storage";

const API = import.meta.env.VITE_API_URL || "/api";
const userFromToken = (token) => {
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(segment + "=".repeat((4 - segment.length % 4) % 4)));
    return payload.role ? { user_id: payload.user_id, email: payload.sub, full_name: payload.sub, role: payload.role, must_change_password: payload.must_change_password } : null;
  } catch { return null; }
};
export async function api(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (path === "/auth/me" && response.status === 404 && token) { const user = userFromToken(token); if (user) return user; }
    const error = new Error(data.error || "Request failed"); error.status = response.status; throw error;
  }
  return data;
}

export function portalUrl(role) {
  const base = `${window.location.protocol}//${window.location.hostname}`;
  if (role === "coordinator") return import.meta.env.VITE_COORDINATOR_URL || `${base}:5174/`;
  if (role === "admin") return import.meta.env.VITE_ADMIN_URL || `${base}:5175/`;
  return `${base}:5173/`;
}
