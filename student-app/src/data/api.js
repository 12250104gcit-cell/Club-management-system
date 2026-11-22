import { getAuthToken, saveAuthSession } from "./storage";

const API = import.meta.env.VITE_API_URL || "/api";
let handoffPromise;
async function consumeHandoff() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("handoff");
  if (!code) return;
  url.searchParams.delete("handoff");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  const response = await fetch(`${API}/auth/handoff/exchange`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not complete sign-in.");
  saveAuthSession(data.token, data.user);
}
const userFromToken = (token) => {
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(segment + "=".repeat((4 - segment.length % 4) % 4)));
    return payload.role ? { user_id: payload.user_id, email: payload.sub, full_name: payload.sub, role: payload.role, must_change_password: payload.must_change_password } : null;
  } catch { return null; }
};
export async function api(path, options = {}) {
  if (!handoffPromise) handoffPromise = consumeHandoff().catch((error) => { handoffPromise = null; throw error; });
  await handoffPromise;
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
  if (role === "student" && import.meta.env.VITE_STUDENT_URL) return import.meta.env.VITE_STUDENT_URL;
  if (role === "coordinator") return import.meta.env.VITE_COORDINATOR_URL || `${base}:5174/`;
  if (role === "admin") return import.meta.env.VITE_ADMIN_URL || `${base}:5175/`;
  return `${base}:5173/`;
}

export async function redirectForRole(role) {
  let target = portalUrl(role);
  try {
    const { code } = await api("/auth/handoff", { method: "POST" });
    const url = new URL(target, window.location.href);
    url.searchParams.set("handoff", code);
    target = url.toString();
  } catch { /* Unauthenticated redirects go to the shared login without a handoff. */ }
  window.location.replace(target);
}
