const CATEGORIES = ["Technology", "Arts", "Arts and Tradition", "Scouts", "Integrity", "Photography", "Sports", "Environment"];
try { localStorage.removeItem("gcit-clubs-v1"); } catch (_) { /* storage may be disabled */ }
const Store = (() => {
  const loggedInAdmin = JSON.parse(localStorage.getItem("adminUser") || "null");
  const adminName = loggedInAdmin?.full_name || "Admin";
  const db = { admin: { firstName: adminName.split(" ")[0], lastName: adminName.split(" ").slice(1).join(" "), email: loggedInAdmin?.email || "", phone: "", date_of_birth: "", gender: "", programme: "", module: "", year_semester: "", enrollment_number: "", enrolment_year: "", role: "Admin" }, clubs: [], coordinators: [], clubMembers: [] };
  let authenticated = false;
  const reload = async () => { [db.clubs, db.coordinators] = await Promise.all([API.clubs(), API.coordinators()]); };
  return {
    async load() { const user = await API.me(); if(user.role !== "admin") { API.redirectForRole(user.role); return false; } authenticated = true; let profile={}; try { profile=await API.profile(); } catch(error) { if(error.status!==404) throw error; } const fullName=profile.full_name||user.full_name||user.email; const parts=fullName.split(" "); Object.assign(db.admin,profile,{firstName:parts[0],lastName:parts.slice(1).join(" "),email:profile.email||user.email,role:"Admin"}); localStorage.setItem("adminUser",JSON.stringify({...user,...profile})); await reload(); return true; },
    isLoggedIn() { return authenticated || Boolean(localStorage.getItem("authToken")); },
    async login(email, password) { const u = await API.login(email, password); Object.assign(db.admin, { firstName: u.full_name.split(" ")[0], lastName: u.full_name.split(" ").slice(1).join(" "), email: u.email }); try { await reload(); } catch(e) { this.logout(); throw e; } return true; },
    async logout() { try { await API.logout(); } finally { authenticated=false; localStorage.removeItem("authToken"); localStorage.removeItem("adminUser"); document.cookie="club_token_share=; Path=/; SameSite=Lax; Max-Age=0"; document.cookie="club_user_share=; Path=/; SameSite=Lax; Max-Age=0"; } },
    clearSession() { authenticated=false; localStorage.removeItem("authToken"); localStorage.removeItem("adminUser"); document.cookie="club_token_share=; Path=/; SameSite=Lax; Max-Age=0"; document.cookie="club_user_share=; Path=/; SameSite=Lax; Max-Age=0"; },
    admin() { return db.admin; }, async updateAdmin(patch) { const fullName=`${patch.firstName} ${patch.lastName}`.trim(); const saved=await API.updateProfile({full_name:fullName,email:patch.email,phone:patch.phone,date_of_birth:patch.date_of_birth,gender:patch.gender}); const parts=saved.full_name.split(" "); Object.assign(db.admin,saved,{firstName:parts[0],lastName:parts.slice(1).join(" "),role:"Admin"}); localStorage.setItem("adminUser",JSON.stringify(saved)); document.cookie=`club_user_share=${encodeURIComponent(JSON.stringify(saved))}; Path=/; SameSite=Lax; Max-Age=86400`; return saved; },
    clubs() { return db.clubs; }, async refreshClubs() { db.clubs = await API.clubs(); return db.clubs; }, club(id) { return db.clubs.find(c => String(c.id) === String(id)); },
    async addClub(data) { const out = await API.request("/clubs", { method: "POST", body: JSON.stringify({ name: data.name, description: data.description, category: data.category, status: data.status || "active", coordinator_id: data.coordinatorId ? Number(data.coordinatorId) : null }) }); await reload(); return this.club(out.id); },
    async updateClub(id, patch) { await API.request(`/clubs/${id}`, { method: "PUT", body: JSON.stringify({ name: patch.name, description: patch.description, category: patch.category, status: String(patch.status || "active").toLowerCase(), coordinator_id: patch.coordinatorId ? Number(patch.coordinatorId) : null }) }); await reload(); },
    async deleteClub(id) { await API.request(`/clubs/${id}`, { method: "DELETE" }); await reload(); },
    async clubMembers(id) { return API.request(`/admin/clubs/${id}/members`); },
    coordinators() { return db.coordinators; }, async refreshCoordinators() { db.coordinators = await API.coordinators(); return db.coordinators; }, coordinator(id) { return db.coordinators.find(c => String(c.id) === String(id)); },
    async addCoordinator(data) { const out = await API.request("/admin/coordinators", { method: "POST", body: JSON.stringify({ name: data.name, email: data.email, password: data.password, club_id: Number(data.clubId) }) }); await reload(); return this.coordinator(out.id); },
    async updateCoordinator(id, data) { await API.request(`/admin/coordinators/${id}`, { method: "PUT", body: JSON.stringify({ name: data.name, email: data.email, club_id: Number(data.clubId) }) }); await reload(); },
    async deleteCoordinator(id) {
      try {
        const coordinator = this.coordinator(id);
        const club = coordinator?.clubId ? this.club(coordinator.clubId) : null;
        // Clear the club foreign key first. This also supports older API builds
        // that cannot delete a referenced user in one transaction.
        if (club) await API.request(`/clubs/${club.id}`, { method: "PUT", body: JSON.stringify({ name: club.name, description: club.description || club.short || "", category: club.category || "", coordinator_id: 0 }) });
        await API.request(`/admin/coordinators/${id}`, { method: "DELETE" });
        await reload();
      } catch(error) {
        try { await reload(); } catch (_) { /* keep the API error visible */ }
        if(error.status===404) error.message="Coordinator was not found or has already been deleted. The list has been refreshed.";
        throw error;
      }
    },
    coordinatorName(id) { return this.coordinator(id)?.name || "Unassigned"; },
    stats() { return { total: db.clubs.length, active: db.clubs.filter(c => c.status === "Active").length, coordinators: db.coordinators.length }; },
  };
})();
