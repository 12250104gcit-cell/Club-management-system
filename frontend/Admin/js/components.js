/* Reusable UI building blocks (return HTML strings) + small helpers */
const UI = (() => {
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  const initials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  };

  const badge = (status, soft = false) =>
    `<span class="badge${soft ? " soft" : ""}${status === "Inactive" ? " inactive" : ""}">${esc(status)}</span>`;

  const avatar = (text, cls = "", img = null) =>
    `<span class="avatar ${cls}">${img ? `<img src="${esc(img)}" alt="" />` : esc(text)}</span>`;

  const clubAvatar = (club, cls = "sq") => avatar(initials(club.name), cls, club.logo);

  const topbar = () => `
    <header class="topbar">
      <img src="assets/logo.svg" alt="GCIT Clubs" />
      <button class="icon-btn" data-action="logout" aria-label="Log out" title="Log out">${Icons.logout}</button>
    </header>`;

  const NAV = [
    { key: "home", label: "Home", href: "#/home", icon: Icons.home },
    { key: "clubs", label: "Clubs", href: "#/clubs", icon: Icons.clubs },
    { key: "coordinators", label: "Coordinators", href: "#/coordinators", icon: Icons.person },
    { key: "profile", label: "Profile", href: "#/profile", icon: Icons.profile },
  ];
  const bottomNav = (active) => `
    <nav class="bottomnav" aria-label="Main">
      ${NAV.map((n) => `<a href="${n.href}" class="${n.key === active ? "active" : ""}" ${n.key === active ? 'aria-current="page"' : ""}>${n.icon}<span>${n.label}</span></a>`).join("")}
    </nav>`;

  const pageTitle = (title, { back = null, right = "" } = {}) => `
    <div class="page-title">
      ${back ? `<a class="icon-btn dark left" href="${back}" aria-label="Back">${Icons.back}</a>` : ""}
      <span>${esc(title)}</span>
      ${right ? `<span class="right">${right}</span>` : ""}
    </div>`;

  const searchBox = (placeholder, value = "") => `
    <label class="search">${Icons.search}
      <input type="search" id="search" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="off" />
    </label>`;

  /* Form fields */
  const field = ({ id, label, required, type = "text", value = "", placeholder = "", error = "This field is required", textarea = false, extra = "" }) => `
    <div class="field" data-field="${id}">
      <label for="${id}">${esc(label)}${required ? ' <span class="req">*</span>' : ""}</label>
      ${textarea
        ? `<textarea class="textarea" id="${id}" name="${id}" placeholder="${esc(placeholder)}" ${extra}>${esc(value)}</textarea>`
        : `<input class="input" id="${id}" name="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${extra} />`}
      <div class="error-text">${esc(error)}</div>
    </div>`;

  const selectField = ({ id, label, required, options, value = "", placeholder = "Select" }) => `
    <div class="field" data-field="${id}">
      <label for="${id}">${esc(label)}${required ? ' <span class="req">*</span>' : ""}</label>
      <select class="select" id="${id}" name="${id}">
        <option value="" ${value ? "" : "selected"} disabled>${esc(placeholder)}</option>
        ${options.map((o) => `<option value="${esc(o.value)}" ${o.value === value ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
      </select>
      <div class="error-text">Please select an option</div>
    </div>`;

  const passwordField = ({ id, label, required, placeholder = "", error = "This field is required" }) => `
    <div class="field" data-field="${id}">
      <label for="${id}">${esc(label)}${required ? ' <span class="req">*</span>' : ""}</label>
      <div class="pw-wrap">
        <input class="input" id="${id}" name="${id}" type="password" placeholder="${esc(placeholder)}" autocomplete="new-password" />
        <button type="button" class="eye" data-toggle-pw="${id}" aria-label="Show password">${Icons.eye}</button>
      </div>
      <div class="error-text">${esc(error)}</div>
    </div>`;

  const uploadBox = ({ label = "Club Logo", hint = "Tap to upload image", preview = null }) => `
    <div class="field">
      <span class="label">${esc(label)}</span>
      <label class="upload" id="upload-box">
        ${preview ? `<img src="${esc(preview)}" alt="Logo preview" />` : `<div>${Icons.image}<p>${esc(hint)}</p></div>`}
        <input type="file" id="logo-file" accept="image/*" />
      </label>
    </div>`;

  /* Modal */
  const confirmModal = ({ title, body, confirmLabel = "Delete" }) => `
    <div class="overlay" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal">
        <h3 id="modal-title">${esc(title)}</h3>
        <p>${body}</p>
        <div class="btn-row">
          <button class="btn btn-outline" data-modal="cancel">Cancel</button>
          <button class="btn btn-primary" data-modal="confirm">${esc(confirmLabel)}</button>
        </div>
      </div>
    </div>`;

  /* Behaviour helpers */
  let toastTimer;
  const toast = (msg) => {
    const el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  };

  const showModal = (root, config, onConfirm) => {
    const host = document.createElement("div");
    host.innerHTML = confirmModal(config);
    const overlay = host.firstElementChild;
    root.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest('[data-modal="cancel"]')) close();
      else if (e.target.closest('[data-modal="confirm"]')) { close(); onConfirm(); }
    });
    overlay.querySelector('[data-modal="cancel"]').focus();
  };

  /* Show/hide password toggles inside a container */
  const bindPasswordToggles = (root) => {
    root.querySelectorAll("[data-toggle-pw]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = root.querySelector("#" + btn.dataset.togglePw);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.innerHTML = show ? Icons.eyeOff : Icons.eye;
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  };

  /* Image upload preview – returns getter for the data URL */
  const bindUpload = (root, initial = null) => {
    let dataUrl = initial;
    const input = root.querySelector("#logo-file");
    const box = root.querySelector("#upload-box");
    if (!input) return () => dataUrl;
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast("Image must be under 2 MB"); input.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => {
        dataUrl = reader.result;
        box.innerHTML = `<img src="${dataUrl}" alt="Logo preview" />`;
        box.appendChild(input);
      };
      reader.readAsDataURL(file);
    });
    return () => dataUrl;
  };

  /* Validation: checks every [data-field] that has [required] marker via config */
  const validate = (root, rules) => {
    let ok = true; const values = {};
    Object.entries(rules).forEach(([id, rule]) => {
      const input = root.querySelector("#" + id);
      const wrap = root.querySelector(`[data-field="${id}"]`);
      const v = (input?.value ?? "").trim();
      values[id] = v;
      let valid = true; let msg = null;
      if (rule.required && !v) valid = false;
      if (valid && rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { valid = false; msg = "Enter a valid email address"; }
      if (valid && rule.min && v.length < rule.min) { valid = false; msg = `Must be at least ${rule.min} characters`; }
      if (valid && rule.match && v !== (root.querySelector("#" + rule.match)?.value ?? "")) { valid = false; msg = "Passwords do not match"; }
      wrap?.classList.toggle("invalid", !valid);
      if (!valid && msg) wrap.querySelector(".error-text").textContent = msg;
      if (!valid) ok = false;
    });
    if (!ok) root.querySelector(".invalid input, .invalid select, .invalid textarea")?.focus();
    return { ok, values };
  };

  const clearInvalidOnInput = (root) => {
    root.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));
    root.addEventListener("change", (e) => e.target.closest(".field")?.classList.remove("invalid"));
  };

  return {
    esc, initials, badge, avatar, clubAvatar, topbar, bottomNav, pageTitle, searchBox,
    field, selectField, passwordField, uploadBox, confirmModal,
    toast, showModal, bindPasswordToggles, bindUpload, validate, clearInvalidOnInput,
  };
})();
