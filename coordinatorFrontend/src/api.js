const API = import.meta.env.VITE_API_URL || "/api";
const cookieValue = (name) => document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
const sharedToken = () => { try { return decodeURIComponent(cookieValue("club_token_share")); } catch { return ""; } };
const sharedIdentity = () => { try { return JSON.parse(decodeURIComponent(cookieValue("club_user_share"))) || null; } catch { return null; } };
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
  localStorage.setItem("authToken", data.token);
  document.cookie = `club_token_share=${encodeURIComponent(data.token)}; Path=/; SameSite=Lax; Max-Age=86400`;
  document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(data.user))}; Path=/; SameSite=Lax; Max-Age=86400`;
}

export async function api(path, options = {}) {
  if (!handoffPromise) handoffPromise = consumeHandoff().catch((error) => { handoffPromise = null; throw error; });
  await handoffPromise;
  const token = localStorage.getItem("authToken") || sharedToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (path === "/auth/me" && response.status === 404 && token) {
      try {
        const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const claims = JSON.parse(atob(segment + "=".repeat((4 - segment.length % 4) % 4)));
        if (claims.role) {
          const identity = sharedIdentity() || {};
          return { user_id: claims.user_id, email: identity.email || claims.sub, full_name: identity.full_name || claims.sub, role: claims.role, must_change_password: claims.must_change_password };
        }
      } catch { /* invalid shared token */ }
    }
    const pollRoute = path.startsWith("/coordinator/polls");
    const message = pollRoute && response.status === 404
      ? "Poll API route is missing. Restart the Sprint 2 backend on port 4001."
      : data.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}
export function portalUrl(role) { const base=`${window.location.protocol}//${window.location.hostname}`; return role==="admin"?`${import.meta.env.VITE_ADMIN_URL||base+':5175/'}`:role==="coordinator"?`${import.meta.env.VITE_COORDINATOR_URL||base+':5174/'}`:`${import.meta.env.VITE_STUDENT_URL||base+':5173/'}`; }
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
