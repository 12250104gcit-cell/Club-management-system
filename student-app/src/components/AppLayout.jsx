import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  House,
  TextSearch,
  Megaphone,
  ListChecks,
  CircleUserRound,
  LogOut
} from "lucide-react";
import Modal from "./Modal";
import { clearCurrentUser } from "../data/storage";
import { api } from "../data/api";

const tabs = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/clubs", label: "Clubs", icon: TextSearch },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/polls", label: "Poll", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: CircleUserRound }
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [membership, setMembership] = useState({ path: "", status: "loading", approved: null, error: "" });

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      setMembership({ path: location.pathname, status: "loading", approved: null, error: "" });
      try {
        const requests = await api("/student/requests");
        if (!active) return;
        const approved = requests.find((request) => request.status?.toLowerCase() === "approved") || null;
        setMembership({ path: location.pathname, status: approved ? "approved" : "locked", approved, error: "" });
      } catch (error) {
        if (active) setMembership({ path: location.pathname, status: "error", approved: null, error: error.message || "Could not check club membership." });
      }
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, [location.pathname]);

  const access = membership.path === location.pathname ? membership : { path: location.pathname, status: "loading", approved: null, error: "" };
  const visibleTabs = access.status === "approved" ? tabs : tabs.filter((tab) => !["/announcements", "/polls"].includes(tab.to));

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    clearCurrentUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <div className="phone">
        <header className="topbar">
          <img src="/logo.png" alt="GCIT Clubs" className="topbar-logo" />
          <button
            type="button"
            className="topbar-logout"
            aria-label="Log out"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut size={26} />
          </button>
        </header>

        <main className="page">
          <Outlet context={{ membership: access }} />
        </main>

        <nav className="bottom-nav" aria-label="Main">
          {visibleTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `bottom-nav-item${isActive ? " active" : ""}`
              }
            >
              <Icon size={30} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {confirmLogout && (
          <Modal
            variant="danger"
            title="Are You Sure?"
            lines={["Are you sure you want to log out?"]}
          >
            <div className="modal-row">
              <button type="button" className="btn-red" onClick={logout}>
                Yes
              </button>
              <button
                type="button"
                className="btn-outline-small"
                onClick={() => setConfirmLogout(false)}
              >
                No
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
