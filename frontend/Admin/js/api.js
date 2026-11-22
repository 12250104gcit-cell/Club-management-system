const API = (() => {
  const base = `${window.location.origin}/api`;
  const cookieValue = (name) => document.cookie.split("; ").find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
  const sharedToken = () => { try { return decodeURIComponent(cookieValue("club_token_share")); } catch { return ""; } };
  const sharedIdentity = () => { try { return JSON.parse(decodeURIComponent(cookieValue("club_user_share"))) || {}; } catch { return {}; } };
  async function request(path, options = {}) {
    const token = localStorage.getItem("authToken") || sharedToken();
    const response = await fetch(`${base}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (path === "/auth/me" && response.status === 404 && token) {
        try { const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); const payload = JSON.parse(atob(segment + "=".repeat((4 - segment.length % 4) % 4))); if (payload.role) { const identity = sharedIdentity(); return { user_id: payload.user_id, email: identity.email || payload.sub, full_name: identity.full_name || payload.sub, role: payload.role, must_change_password: payload.must_change_password }; } } catch (_) { /* token is not readable */ }
      }
      const error = new Error(data.error || `Request failed (${response.status})`); error.status = response.status; throw error;
    }
    return data;
  }
  return {
    request,
    me() { return request("/auth/me"); },
    profile() { return request("/auth/profile"); },
    updateProfile(profile) { return request("/auth/profile", { method: "PUT", body: JSON.stringify(profile) }); },
    async logout() { return request("/auth/logout", { method: "POST" }); },
    redirectForRole(role) { const baseUrl = `${window.location.protocol}//${window.location.hostname}`; const ports = { student: 5173, coordinator: 5174, admin: 5175 }; window.location.replace(`${baseUrl}:${ports[role] || ports.student}/`); },
    async login(email, password) { const d = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); if (d.user.role !== "admin") throw new Error("Use the portal for your account role."); localStorage.setItem("authToken", d.token); document.cookie = `club_token_share=${encodeURIComponent(d.token)}; Path=/; SameSite=Lax; Max-Age=86400`; document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(d.user))}; Path=/; SameSite=Lax; Max-Age=86400`; localStorage.setItem("adminUser", JSON.stringify(d.user)); return d.user; },
    async clubs() { return (await request("/clubs")).map(c => ({ ...c, id: String(c.id), short: c.description, category: c.category || "", coordinatorId: c.coordinator_id.Valid ? String(c.coordinator_id.Int64) : null, members: c.members || 0, status: "Active", logo: null })); },
    async coordinators() { return (await request("/admin/coordinators")).map(c => ({ ...c, id: String(c.id), clubId: c.club_id.Valid ? String(c.club_id.Int64) : null, created: "" })); },
  };
})();
