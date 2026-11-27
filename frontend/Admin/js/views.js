/* ==========================================================
   Views – every view returns { nav, title?, html, mount(root) }
   nav: which bottom-nav tab is active (null hides nothing,
        "none" hides the shell entirely, e.g. login)
   ========================================================== */
const Views = (() => {
  const { esc, initials, badge, avatar, clubAvatar, pageTitle, searchBox } = UI;
  const go = (hash) => { location.hash = hash; };

  /* ---------------------------------------------------- Login */
  const login = () => ({
    nav: "none",
    html: `
      <main class="login view-enter">
        <div class="brand">
          <div class="row"><img src="assets/logo.svg" alt="" /><h1>GCIT CLUBS</h1></div>
          <p>Manage | Connect | Participate</p>
        </div>
        <form id="login-form" novalidate>
          <div class="form-error" id="login-error" role="alert"></div>
          <div class="field" data-field="email">
            <label for="email">Email Address</label>
            <input class="input pill" id="email" name="email" type="email" placeholder="Enter Your Email Address" autocomplete="username" />
            <div class="error-text">Enter a valid email address</div>
          </div>
          <div class="field" data-field="password">
            <label for="password">Password</label>
            <div class="pw-wrap">
              <input class="input pill" id="password" name="password" type="password" placeholder="Enter Your Password" autocomplete="current-password" />
              <button type="button" class="eye" data-toggle-pw="password" aria-label="Show password">${Icons.eye}</button>
            </div>
            <div class="error-text">Password is required</div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" type="submit" style="margin-top:12px">LOGIN</button>
        </form>
        <div class="divider">OR</div>
        <button class="btn btn-outline btn-block btn-google" id="google-btn" type="button">${Icons.google}<span>Sign in with Google</span></button>
        <p class="signup">Don't have an account yet? <a href="#/login" id="signup-link">Sign up</a></p>
        <p class="footer">GCIT Club Management App</p>
      </main>`,
    mount(root) {
      const studentPortal = API.portalUrl("student").replace(/\/+$/, "");
      const sharedLogin = studentPortal.endsWith("/login") ? studentPortal : `${studentPortal}/login`;
      location.replace(sharedLogin);
    },
  });

  /* ---------------------------------------------------- Dashboard */
  const home = () => {
    const s = Store.stats();
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const clubs = Store.clubs();
    return {
      nav: "home",
      html: `
        <div class="view-enter">
          ${pageTitle("Admin")}
          <p class="greeting">${greet}, Admin</p>
          <div class="stats">
            <div class="stat"><b>${s.total}</b><span>Total Clubs</span></div>
            <div class="stat"><b>${s.active}</b><span>Active Clubs</span></div>
            <div class="stat"><b>${s.coordinators}</b><span>Coordinators</span></div>
          </div>
          <div class="section-head"><span>Clubs</span><span>Status</span></div>
          <div>
            ${clubs.length ? clubs.map((c) => `
              <a class="recent-row" href="#/clubs/${c.id}">
                ${clubAvatar(c, "sq lg")}
                <div class="info"><div class="name">${esc(c.name)}</div><div class="sub">${esc(Store.coordinatorName(c.coordinatorId))}</div></div>
                ${badge(c.status)}
              </a>`).join("") : '<p class="empty">No clubs yet.</p>'}
          </div>
        </div>`,
    };
  };

  /* ---------------------------------------------------- Clubs list */
  const clubRows = (list) =>
    list.length
      ? `<div class="list-card">${list.map((c) => `
          <a class="list-row" href="#/clubs/${c.id}">
            ${clubAvatar(c, "sq")}
            <div class="info"><div class="name">${esc(c.name)}</div><div class="sub">${esc(c.category)}</div></div>
            ${badge(c.status)}
          </a>`).join("")}</div>`
      : '<p class="empty">No clubs match your search.</p>';

  const clubs = () => ({
    nav: "clubs",
    html: `
      <div class="view-enter">
        ${pageTitle("All Clubs", { back: "#/home" })}
        ${searchBox("Search clubs..")}
        <div class="btn-end"><a class="btn btn-primary btn-sm" href="#/clubs/new" style="text-decoration:none">${Icons.plus} Create Club</a></div>
        <div class="list-head"><span>Club Name</span><span>Status</span></div>
        <div id="list">${clubRows(Store.clubs())}</div>
      </div>`,
    mount(root) {
      root.querySelector("#search").addEventListener("input", (e) => {
        const q = e.target.value.trim().toLowerCase();
        root.querySelector("#list").innerHTML = clubRows(
          Store.clubs().filter((c) => (c.name + " " + c.category).toLowerCase().includes(q))
        );
      });
    },
  });

  /* ---------------------------------------------------- Club details */
  const clubDetail = ({ id }) => {
    const c = Store.club(id);
    if (!c) return notFound("Club not found", "#/clubs");
    let members = [];
    return {
      nav: "clubs",
      html: `
        <div class="view-enter">
          ${pageTitle("Club Details", { back: "#/clubs" })}
          <div class="banner">${c.logo ? `<img src="${esc(c.logo)}" alt="${esc(c.name)} logo" />` : esc(c.name.toUpperCase())}</div>
          <h2 class="club-title">${esc(c.name)}</h2>
          <p class="club-cat">${esc(c.category)}</p>
          <h3 class="h3">Description</h3>
          <p class="desc">${esc(c.description)}</p>
          <div class="facts">
            <div class="fact">${Icons.person}<span>Coordinators</span><span>${esc(Store.coordinatorName(c.coordinatorId))}</span></div>
            <div class="fact">${Icons.members}<span>Members</span><span>${c.members}</span></div>
            <div class="fact">${Icons.status}<span>Status</span><span>${badge(c.status)}</span></div>
          </div>
          <div class="btn-row">
            <a class="btn btn-primary" href="#/clubs/${c.id}/edit" style="text-decoration:none">Edit Club</a>
            <button class="btn btn-outline" id="delete-btn">Delete Club</button>
          </div>
          <div class="section-head" style="margin-top:20px"><span>Members</span><a href="#" id="view-all">View All</a></div>
          <div id="members"></div>
        </div>`,
      mount(root) {
        let all = false;
        const renderMembers = () => {
          const shown = all ? members : members.slice(0, 2);
          root.querySelector("#members").innerHTML = shown.map((m) => `
            <div class="member-row">
              ${avatar(initials(m.name)[0])}
              <div class="info"><div class="name">${esc(m.name)}</div><div class="sub">${esc(m.email || "")}</div></div>
              ${badge(m.status, true)}
            </div>`).join("");
          root.querySelector("#view-all").textContent = all ? "Show Less" : "View All";
        };
        root.querySelector("#members").textContent = "Loading members…";
        Store.clubMembers(c.id).then((data) => { members = data.map(m => ({ ...m, status: "Active" })); renderMembers(); }).catch(e => { root.querySelector("#members").textContent = e.message; });
        root.querySelector("#view-all").addEventListener("click", (e) => { e.preventDefault(); all = !all; renderMembers(); });
        root.querySelector("#delete-btn").addEventListener("click", () => {
          UI.showModal(document.getElementById("app"), {
            title: "Delete Club?",
            body: `Are you sure you want to delete "<b>${esc(c.name)}</b>"? This action cannot be undone.`,
          }, async () => { try { await Store.deleteClub(c.id); UI.toast("Club deleted"); go("#/clubs"); } catch(e) { UI.toast(e.message); } });
        });
      },
    };
  };

  /* ---------------------------------------------------- Club create / edit */
  const clubForm = (club) => {
    const editing = !!club;
    const coordOptions = Store.coordinators().map((co) => ({ value: co.id, label: co.name }));
    return {
      nav: "clubs",
      html: `
        <div class="view-enter">
          ${pageTitle(editing ? "Edit Club" : "Create Club", { back: editing ? `#/clubs/${club.id}` : "#/clubs" })}
          <form id="club-form" novalidate>
            ${UI.field({ id: "name", label: "Club Name", required: true, placeholder: "Enter club name", value: club?.name })}
            ${UI.selectField({ id: "category", label: "Category", required: true, placeholder: "Select category", value: club?.category, options: CATEGORIES.map((c) => ({ value: c, label: c })) })}
            ${UI.selectField({ id: "status", label: "Status", required: true, placeholder: "Select status", value: (club?.status || "Active").toLowerCase(), options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] })}
            ${UI.field({ id: "description", label: "Description", required: true, placeholder: "Enter description", value: club?.description, textarea: true })}
            ${UI.uploadBox({ label: "Club Logo", hint: editing ? "Change Club Logo" : "Tap to upload image", preview: club?.logo })}
            ${UI.selectField({ id: "coordinatorId", label: "Coordinator", required: false, placeholder: "Select coordinator", value: club?.coordinatorId || "", options: coordOptions })}
            <div class="btn-row" style="margin-top:6px">
              <a class="btn btn-outline" href="${editing ? `#/clubs/${club.id}` : "#/clubs"}" style="text-decoration:none">Cancel</a>
              <button class="btn btn-primary" type="submit">${editing ? "Save Changes" : "Create Club"}</button>
            </div>
          </form>
        </div>`,
      mount(root) {
        UI.clearInvalidOnInput(root);
        const getLogo = UI.bindUpload(root, club?.logo || null);
        root.querySelector("#club-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const { ok, values } = UI.validate(root, {
            name: { required: true },
            category: { required: true },
            status: { required: true },
            description: { required: true },
          });
          if (!ok) return;
          const payload = { ...values, logo: getLogo() };
          const button = root.querySelector('button[type="submit"]'); button.disabled = true;
          try { if (editing) { await Store.updateClub(club.id, payload); UI.toast("Club updated"); go(`#/clubs/${club.id}`); }
          else { const c = await Store.addClub(payload); UI.toast("Club created"); go(`#/clubs/${c.id}`); } } catch(error) { UI.toast(error.message); button.disabled = false; }
        });
      },
    };
  };
  const clubNew = () => clubForm(null);
  const clubEdit = ({ id }) => { const c = Store.club(id); return c ? clubForm(c) : notFound("Club not found", "#/clubs"); };

  /* ---------------------------------------------------- Coordinators list */
  const coordRows = (list) =>
    list.length
      ? `<table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Club</th><th>Status</th></tr></thead>
          <tbody>${list.map((c) => {
            const club = Store.club(c.clubId);
            return `<tr class="row-link" data-id="${c.id}" tabindex="0">
              <td><div class="who">${avatar(initials(c.name), "sm")}<span>${esc(c.name)}</span></div></td>
              <td><div class="trunc">${esc(c.email)}</div></td>
              <td>${esc(club ? club.name.replace(/ Club$/, "") : "—")}</td>
              <td>${badge(c.status)}</td>
            </tr>`; }).join("")}</tbody>
        </table>`
      : '<p class="empty">No coordinators found.</p>';

  const coordinators = () => ({
    nav: "coordinators",
    html: `
      <div class="view-enter">
        ${pageTitle("Coordinator Accounts")}
        ${searchBox("Search coordinators..")}
        <div class="btn-end"><a class="btn btn-primary btn-sm" href="#/coordinators/new" style="text-decoration:none">${Icons.plus} Create Coordinators</a></div>
        <div id="list" role="status">Refreshing coordinator list…</div>
      </div>`,
    mount(root) {
      const list = root.querySelector("#list");
      const open = (e) => { const row = e.target.closest("tr[data-id]"); if (row) go(`#/coordinators/${row.dataset.id}`); };
      list.addEventListener("click", open);
      list.addEventListener("keydown", (e) => { if (e.key === "Enter") open(e); });
      const renderList = () => {
        const q = root.querySelector("#search").value.trim().toLowerCase();
        const rows = Store.coordinators().filter((c) => (c.name + " " + c.email).toLowerCase().includes(q));
        list.innerHTML = coordRows(rows);
      };
      root.querySelector("#search").addEventListener("input", (e) => {
        renderList();
      });
      const refresh = async () => {
        list.textContent = "Refreshing coordinator list…";
        try { await Store.refreshCoordinators(); renderList(); }
        catch (error) {
          list.innerHTML = `<p class="empty" role="alert">Could not refresh coordinator list. ${esc(error.message)} <button class="btn btn-outline btn-sm" type="button" id="retry-coordinators">Retry</button></p>`;
          list.querySelector("#retry-coordinators").addEventListener("click", refresh);
        }
      };
      refresh();
    },
  });

  /* ---------------------------------------------------- Coordinator create */
  const clubOptions = (coordinatorId = null) => Store.clubs()
    .filter((club) => !club.coordinatorId || String(club.coordinatorId) === String(coordinatorId))
    .map((c) => ({ value: c.id, label: c.name }));
  const refreshClubSelect = (root, selected = "", coordinatorId = null) => {
    const select = root.querySelector("#clubId");
    if (!select) return;
    const current = selected || select.value;
    select.disabled = true;
    Store.refreshClubs().then(() => {
      if (!root.contains(select)) return;
      const options = clubOptions(coordinatorId);
      select.innerHTML = `<option value="" disabled>Select Club</option>${options.map((option) => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join("")}`;
      select.value = options.some((option) => String(option.value) === String(current)) ? current : "";
      select.disabled = false;
    }).catch((error) => { select.disabled = false; UI.toast(`Could not refresh clubs: ${error.message}`); });
  };

  const coordNew = () => ({
    nav: "coordinators",
    html: `
      <div class="view-enter">
        ${pageTitle("Create Coordinator", { back: "#/coordinators" })}
        <form id="coord-form" novalidate>
          ${UI.field({ id: "name", label: "Full Name", required: true, placeholder: "Enter name" })}
          ${UI.field({ id: "email", label: "Email", required: true, type: "email", placeholder: "Enter email", error: "Enter a valid email address" })}
          ${UI.passwordField({ id: "password", label: "Password", required: true, placeholder: "Enter password", error: "Password is required" })}
          ${UI.selectField({ id: "clubId", label: "Assign Club", required: true, placeholder: "Select Club", options: clubOptions() })}
          <div class="stack" style="margin-top:28px">
            <button class="btn btn-primary btn-block" type="submit">Create Coordinator</button>
            <a class="btn btn-outline btn-block" href="#/coordinators" style="text-decoration:none">Cancel</a>
          </div>
        </form>
      </div>`,
    mount(root) {
      refreshClubSelect(root);
      UI.clearInvalidOnInput(root);
      UI.bindPasswordToggles(root);
      root.querySelector("#coord-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const { ok, values } = UI.validate(root, {
          name: { required: true },
          email: { required: true, email: true },
          password: { required: true, min: 8 },
          clubId: { required: true },
        });
        if (!ok) return;
        try { const co = await Store.addCoordinator(values); UI.toast("Coordinator created"); go(`#/coordinators/${co.id}`); } catch(error) { UI.toast(error.message); }
      });
    },
  });

  /* ---------------------------------------------------- Coordinator details */
  const coordDetail = ({ id }) => {
    const c = Store.coordinator(id);
    if (!c) return notFound("Coordinator not found", "#/coordinators");
    const club = Store.club(c.clubId);
    return {
      nav: "coordinators",
      html: `
        <div class="view-enter">
          ${pageTitle("Coordinator Details", { back: "#/coordinators" })}
          <div class="card-grey profile-card">
            ${avatar(initials(c.name), "xl")}
            <h2>${esc(c.name)}</h2>
            <p class="email">${esc(c.email)}</p>
            ${badge(c.status, true)}
          </div>
          <div class="card-grey">
            <h3 class="card-title">Account Information</h3>
            <div class="info-row"><span>Full Name</span><span>${esc(c.name)}</span></div>
            <div class="info-row"><span>Email</span><span>${esc(c.email)}</span></div>
            <div class="info-row"><span>Assign Club</span><span>${esc(club ? club.name : "None")}</span></div>
            <div class="info-row"><span>Created</span><span>${esc(c.created)}</span></div>
          </div>
          <div class="card-grey">
            <h3 class="card-title">Assigned Club</h3>
            ${club ? `<a class="club-chip" href="#/clubs/${club.id}" style="text-decoration:none;color:inherit">${clubAvatar(club, "sq lg")}<span>${esc(club.name)}<small>${club.members} members</small></span></a>` : '<p class="empty" style="padding:6px">No club assigned.</p>'}
          </div>
          <div class="stack">
            <a class="btn btn-primary btn-block" href="#/coordinators/${c.id}/edit" style="text-decoration:none">Edit Coordinator</a>
            <button class="btn btn-outline btn-block" id="delete-btn">Delete Coordinator</button>
          </div>
        </div>`,
      mount(root) {
        root.querySelector("#delete-btn").addEventListener("click", () => {
          UI.showModal(document.getElementById("app"), {
            title: "Delete Coordinator?",
            body: `Are you sure you want to delete account of <b>${esc(c.name)}</b>?`,
          }, async () => { try { await Store.deleteCoordinator(c.id); UI.toast("Coordinator deleted"); go("#/coordinators"); } catch(e) { UI.toast(e.message); if(e.status===404) go("#/coordinators"); } });
        });
      },
    };
  };

  /* ---------------------------------------------------- Coordinator edit */
  const coordEdit = ({ id }) => {
    const c = Store.coordinator(id);
    if (!c) return notFound("Coordinator not found", "#/coordinators");
    return {
      nav: "coordinators",
      html: `
        <div class="view-enter">
          ${pageTitle("Edit Coordinator", { back: `#/coordinators/${c.id}` })}
          <form id="coord-form" novalidate>
            ${UI.field({ id: "name", label: "Full Name", required: true, value: c.name })}
            ${UI.field({ id: "email", label: "Email", required: true, type: "email", value: c.email, error: "Enter a valid email address" })}
            ${UI.selectField({ id: "clubId", label: "Assign Club", required: true, value: c.clubId || "", placeholder: "Select Club", options: clubOptions(c.id) })}
            <div class="field">
              <span class="label">Account Status</span>
              <div class="radio-row">
                <label><input type="radio" name="status" value="Active" ${c.status === "Active" ? "checked" : ""} /> Active</label>
                <label><input type="radio" name="status" value="Inactive" ${c.status === "Inactive" ? "checked" : ""} /> Inactive</label>
              </div>
            </div>
            <div class="btn-row" style="margin-top:24px">
              <a class="btn btn-outline" href="#/coordinators/${c.id}" style="text-decoration:none">Cancel</a>
              <button class="btn btn-primary" type="submit">Save Changes</button>
            </div>
          </form>
        </div>`,
      mount(root) {
        refreshClubSelect(root, c.clubId || "", c.id);
        UI.clearInvalidOnInput(root);
        root.querySelector("#coord-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const { ok, values } = UI.validate(root, {
            name: { required: true },
            email: { required: true, email: true },
            clubId: { required: true },
          });
          if (!ok) return;
          values.status = root.querySelector('input[name="status"]:checked').value;
          try { await Store.updateCoordinator(c.id, values); UI.toast("Coordinator updated"); go(`#/coordinators/${c.id}`); } catch(error) { UI.toast(error.message); }
        });
      },
    };
  };

  /* ---------------------------------------------------- Profile */
  const profile = () => {
    const a = Store.admin();
    return {
      nav: "profile",
      html: `
        <div class="view-enter">
          ${pageTitle("Profile & Settings")}
          <div class="cover">
            <img class="logo-big" src="assets/logo.svg" alt="GCIT" />
            ${avatar(a.firstName[0], "", a.avatar)}
          </div>
          <h2 class="profile-name">${esc(a.firstName)} ${esc(a.lastName)}</h2>
          <p class="profile-role"><span class="badge role">${esc(a.role)}</span></p>
          <div class="contact-card">
            <div class="contact-row">${Icons.mail}<div><small>Email</small>${esc(a.email)}</div></div>
            <div class="contact-row">${Icons.phone}<div><small>Phone number</small>${esc(a.phone)}</div></div>
          </div>
          <div class="card-grey" style="margin-top:16px">
            <h3 class="card-title">Personal Information</h3>
            <div class="info-row"><span>Date of Birth</span><span>${esc(a.date_of_birth || "Not provided")}</span></div>
            <div class="info-row"><span>Gender</span><span>${esc(a.gender || "Not provided")}</span></div>
          </div>
          <a class="btn btn-primary btn-block btn-lg" href="#/profile/edit" style="text-decoration:none;font-size:14px">${Icons.pencil} Edit Profile</a>
          <button class="btn btn-outline btn-block" id="reset-btn" style="margin-top:12px">Refresh server data</button>
        </div>`,
      mount(root) {
        root.querySelector("#reset-btn").addEventListener("click", async () => {
          try { await Store.load(); UI.toast("Data refreshed"); Router.render(); } catch(e) { UI.toast(e.message); }
        });
      },
    };
  };

  const profileEdit = () => {
    const a = Store.admin();
    return {
      nav: "profile",
      html: `
        <div class="view-enter">
          ${pageTitle("Profile & Settings", { back: "#/profile" })}
          <div class="avatar-edit">
            <span id="avatar-holder">${avatar(a.firstName[0], "xl", a.avatar)}</span>
            <label class="cam" title="Change photo">${Icons.camera}<input type="file" id="avatar-file" accept="image/*" hidden /></label>
          </div>
          <p class="section-label" style="font-weight:400">Account Settings</p>
          <form id="profile-form" novalidate>
            <div class="two-col">
              ${UI.field({ id: "firstName", label: "First Name", required: true, value: a.firstName })}
              ${UI.field({ id: "lastName", label: "Last Name", required: true, value: a.lastName })}
            </div>
            ${UI.field({ id: "email", label: "Email", required: true, type: "email", value: a.email, error: "Enter a valid email address" })}
            ${UI.field({ id: "phone", label: "Phone number", type: "tel", value: a.phone, extra: 'inputmode="tel"' })}
            <div class="two-col">
              ${UI.field({ id: "date_of_birth", label: "Date of Birth", type: "date", value: a.date_of_birth })}
              ${UI.field({ id: "gender", label: "Gender", value: a.gender })}
            </div>
            <div style="display:flex;gap:12px;margin-top:20px">
              <a class="btn btn-primary btn-sm" href="#/profile/password" style="text-decoration:none">Edit Password</a>
              <button class="btn btn-primary btn-sm" type="submit">Save Changes</button>
            </div>
          </form>
        </div>`,
      mount(root) {
        UI.clearInvalidOnInput(root);
        let newAvatar = a.avatar;
        root.querySelector("#avatar-file").addEventListener("change", (e) => {
          const f = e.target.files[0]; if (!f) return;
          if (f.size > 2 * 1024 * 1024) { UI.toast("Image must be under 2 MB"); return; }
          const r = new FileReader();
          r.onload = () => { newAvatar = r.result; root.querySelector("#avatar-holder").innerHTML = avatar("", "xl", newAvatar); };
          r.readAsDataURL(f);
        });
        root.querySelector("#profile-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const { ok, values } = UI.validate(root, {
            firstName: { required: true }, lastName: { required: true },
            email: { required: true, email: true },
          });
          if (!ok) return;
          try { await Store.updateAdmin({ ...values, avatar: newAvatar }); UI.toast("Profile saved"); go("#/profile"); }
          catch(error) { UI.toast(error.message); }
        });
      },
    };
  };

  const password = () => ({
    nav: "profile",
    html: `
      <div class="view-enter">
        ${pageTitle("Profile & Settings", { back: "#/profile/edit" })}
        <p class="section-label" style="margin-top:22px">Password Setting</p>
        <form class="box" id="pw-form" novalidate>
          <div class="box-head">${Icons.lock}<span>Change Password</span></div>
          ${UI.passwordField({ id: "current", label: "Current Password", required: true, placeholder: "Enter Your Current Password" })}
          ${UI.passwordField({ id: "next", label: "New Password", required: true, placeholder: "Enter Your New Password", error: "Must be at least 8 characters" })}
          ${UI.passwordField({ id: "confirm", label: "Confirm Password", required: true, placeholder: "Confirm new password", error: "Passwords do not match" })}
          <div class="stack" style="margin-top:16px">
            <button class="btn btn-primary btn-block" type="submit">Save Changes</button>
            <a class="btn btn-outline btn-block" href="#/profile/edit" style="text-decoration:none">Cancel</a>
          </div>
        </form>
      </div>`,
    mount(root) {
      UI.clearInvalidOnInput(root);
      UI.bindPasswordToggles(root);
      root.querySelector("#pw-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const { ok } = UI.validate(root, {
          current: { required: true },
          next: { required: true, min: 8 },
          confirm: { required: true, match: "next" },
        });
        if (!ok) return;
        const submit = e.currentTarget.querySelector('button[type="submit"]');
        submit.disabled = true;
        submit.textContent = "Saving…";
        API.changePassword(root.querySelector("#current").value, root.querySelector("#next").value)
          .then(() => { UI.toast("Password updated"); go("#/profile"); })
          .catch((error) => UI.toast(error.message || "Could not change the password."))
          .finally(() => { submit.disabled = false; submit.textContent = "Save Changes"; });
      });
    },
  });

  /* ---------------------------------------------------- 404 */
  const notFound = (msg = "Page not found", back = "#/home") => ({
    nav: null,
    html: `<div class="view-enter">${pageTitle("Oops", { back })}<p class="empty">${esc(msg)}</p></div>`,
  });

  return { login, home, clubs, clubDetail, clubNew, clubEdit, coordinators, coordNew, coordDetail, coordEdit, profile, profileEdit, password, notFound };
})();
