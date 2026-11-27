/* Shared API client for the vanilla Admin portal. */
const API_BASE_URL = "/api";
let handoffPromise;

function saveSession(token, user) {
  if (token) localStorage.setItem("authToken", token);
  if (user) {
    localStorage.setItem("adminUser", JSON.stringify(user));
    document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(user))}; Path=/; SameSite=Lax; Max-Age=86400`;
  }
}

async function consumeHandoff() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("handoff");
  if (!code) return;
  url.searchParams.delete("handoff");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  const response = await fetch(`${API_BASE_URL}/auth/handoff/exchange`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not complete sign-in.");
  saveSession(data.token, data.user);
}

async function request(path, options = {}) {
  if (!handoffPromise) handoffPromise = consumeHandoff().catch((error) => { handoffPromise = null; throw error; });
  await handoffPromise;
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const token = localStorage.getItem("authToken");
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: "include", headers });
  } catch (_) {
    throw new Error("Could not reach the Club Management API. Check that it is running on port 4001.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function login(email, password) {
  const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  saveSession(data.token, data.user);
  return data.user;
}

function nullableId(value) {
  if (value == null) return null;
  if (typeof value === "object" && "Valid" in value) return value.Valid ? Number(value.Int64) : null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function clubs() {
  const rows = await request("/clubs");
  return rows.map((club) => ({
    ...club,
    id: Number(club.id),
    status: String(club.status || "active").toLowerCase() === "inactive" ? "Inactive" : "Active",
    coordinatorId: nullableId(club.coordinator_id),
    coordinatorName: club.coordinator_name || "",
    activeMembers: Number(club.members || 0),
  }));
}

async function coordinators() {
  const rows = await request("/admin/coordinators");
  return rows.map((coordinator) => ({
    ...coordinator,
    id: Number(coordinator.id),
    clubId: nullableId(coordinator.club_id),
    clubName: typeof coordinator.club_name === "object"
      ? (coordinator.club_name.Valid ? coordinator.club_name.String : "")
      : (coordinator.club_name || ""),
  }));
}

function portalUrl(role) {
  const base = `${window.location.protocol}//${window.location.hostname}`;
  if (role === "coordinator") return `${base}:5174/`;
  if (role === "admin") return `${base}:5175/`;
  return `${base}:5173/login`;
}

async function redirectForRole(role) {
  let target = portalUrl(role);
  try {
    const { code } = await request("/auth/handoff", { method: "POST" });
    const url = new URL(target, window.location.href);
    url.searchParams.set("handoff", code);
    target = url.toString();
  } catch (_) { /* Unauthenticated users continue to the shared login. */ }
  window.location.replace(target);
}

const API = {
  request,
  login,
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  profile: () => request("/auth/profile"),
  updateProfile: (profile) => request("/auth/profile", { method: "PUT", body: JSON.stringify(profile) }),
  changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "PUT", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),
  clubs,
  coordinators,
  portalUrl,
  redirectForRole,
};

window.API = API;
