const API = (() => {
  const base = window.APP_CONFIG?.apiBaseUrl || `${window.location.origin}/api`;
  const localPortals = { student: `${window.location.protocol}//${window.location.hostname}:5173/`, coordinator: `${window.location.protocol}//${window.location.hostname}:5174/`, admin: `${window.location.protocol}//${window.location.hostname}:5175/` };
  let handoffPromise;
  const cookieValue = (name) => document.cookie.split("; ").find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
  const sharedToken = () => { try { return decodeURIComponent(cookieValue("club_token_share")); } catch { return ""; } };
  const sharedIdentity = () => { try { return JSON.parse(decodeURIComponent(cookieValue("club_user_share"))) || {}; } catch { return {}; } };
  async function consumeHandoff() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("handoff");
    if (!code) return;
    url.searchParams.delete("handoff");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    const response = await fetch(`${base}/auth/handoff/exchange`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not complete sign-in.");
    localStorage.setItem("authToken", data.token);
    document.cookie = `club_token_share=${encodeURIComponent(data.token)}; Path=/; SameSite=Lax; Max-Age=86400`;
    document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(data.user))}; Path=/; SameSite=Lax; Max-Age=86400`;
  }
  async function request(path, options = {}) {
    if (!path.endsWith("/auth/handoff/exchange")) {
      if (!handoffPromise) handoffPromise = consumeHandoff().catch((error) => { handoffPromise = null; throw error; });
      await handoffPromise;
    }
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
    portalUrl(role) { return window.APP_CONFIG?.portalUrls?.[role] || localPortals[role] || localPortals.student; },
    profile() { return request("/auth/profile"); },
    updateProfile(profile) { return request("/auth/profile", { method: "PUT", body: JSON.stringify(profile) }); },
    changePassword(currentPassword, newPassword) { return request("/auth/change-password", { method: "PUT", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }); },
    async logout() { return request("/auth/logout", { method: "POST" }); },
    async redirectForRole(role) {
      let target = this.portalUrl(role);
      if (localStorage.getItem("authToken") || sharedToken()) {
        try { const { code } = await request("/auth/handoff", { method: "POST" }); const url = new URL(target, window.location.href); url.searchParams.set("handoff", code); target = url.toString(); } catch (_) { /* Keep role redirects functional when no active session exists. */ }
      }
      window.location.replace(target);
    },
    async login(email, password) { const d = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); if (d.user.role !== "admin") throw new Error("Use the portal for your account role."); localStorage.setItem("authToken", d.token); document.cookie = `club_token_share=${encodeURIComponent(d.token)}; Path=/; SameSite=Lax; Max-Age=86400`; document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(d.user))}; Path=/; SameSite=Lax; Max-Age=86400`; localStorage.setItem("adminUser", JSON.stringify(d.user)); return d.user; },
    async clubs() { return (await request("/clubs")).map(c => ({ ...c, id: String(c.id), short: c.description, category: c.category || "", coordinatorId: c.coordinator_id.Valid ? String(c.coordinator_id.Int64) : null, members: c.members || 0, status: "Active", logo: null })); },
    async coordinators() { return (await request("/admin/coordinators")).map(c => ({ ...c, id: String(c.id), clubId: c.club_id.Valid ? String(c.club_id.Int64) : null, created: "" })); },
  };
})();
