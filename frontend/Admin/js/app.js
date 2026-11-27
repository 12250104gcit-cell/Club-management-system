/* Hash router + app shell */
const Router = (() => {
  const app = () => document.getElementById("app");

  const ROUTES = [
    [/^\/login$/, Views.login, false],
    [/^\/home$/, Views.home, true],
    [/^\/clubs$/, Views.clubs, true],
    [/^\/clubs\/new$/, Views.clubNew, true],
    [/^\/clubs\/([\w-]+)\/edit$/, Views.clubEdit, true, ["id"]],
    [/^\/clubs\/([\w-]+)$/, Views.clubDetail, true, ["id"]],
    [/^\/coordinators$/, Views.coordinators, true],
    [/^\/coordinators\/new$/, Views.coordNew, true],
    [/^\/coordinators\/([\w-]+)\/edit$/, Views.coordEdit, true, ["id"]],
    [/^\/coordinators\/([\w-]+)$/, Views.coordDetail, true, ["id"]],
    [/^\/profile$/, Views.profile, true],
    [/^\/profile\/edit$/, Views.profileEdit, true],
    [/^\/profile\/password$/, Views.password, true],
  ];

  const currentPath = () => (location.hash.replace(/^#/, "") || "/home");

  function render() {
    const path = currentPath();
    let match = null;
    for (const [re, view, protectedRoute, keys] of ROUTES) {
      const m = path.match(re);
      if (m) { match = { view, protectedRoute, params: Object.fromEntries((keys || []).map((k, i) => [k, m[i + 1]])) }; break; }
    }

    if (!match) match = { view: Views.notFound, protectedRoute: true, params: {} };

    // Auth guard
    if (match.protectedRoute && !Store.isLoggedIn()) { location.replace("#/login"); return; }
    if (path === "/login" && Store.isLoggedIn()) { location.replace("#/home"); return; }

    const v = match.view(match.params);

    if (v.nav === "none") {
      app().innerHTML = v.html;
      v.mount && v.mount(app());
      return;
    }

    app().innerHTML = `
      ${UI.topbar()}
      <main class="content" id="content" tabindex="-1">${v.html}</main>
      ${v.nav ? UI.bottomNav(v.nav) : ""}`;

    const content = document.getElementById("content");
    content.scrollTop = 0;
    app().querySelector('[data-action="logout"]').addEventListener("click", () => {
      UI.showModal(app(), {
        title: "Log out?",
        body: "Are you sure you want to log out of your admin account?",
        confirmLabel: "Log out",
      }, async () => {
        try { await Store.logout(); } catch (_) { /* Clear the local session even if the server session already expired. */ }
        UI.toast("Logged out");
        location.hash = "#/login";
      });
    });
    v.mount && v.mount(content);
  }

  function start() {
    window.addEventListener("hashchange", render);
    if (!location.hash) location.replace(Store.isLoggedIn() ? "#/home" : "#/login");
    else render();
  }

  return { start, render };
})();

Store.load().then((authenticated) => { if (authenticated) Router.start(); }).catch(() => { Store.clearSession(); API.redirectForRole("student"); });
