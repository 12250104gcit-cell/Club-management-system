import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api, portalUrl } from "../data/api";
import { getAuthToken, saveAuthSession } from "../data/storage";

export default function RequireAuth() {
  const [state, setState] = useState("checking");
  const location = useLocation();
  useEffect(() => {
    api("/auth/me").then(user => {
      if (user.role === "student") { saveAuthSession(getAuthToken() || "", user); setState(user.must_change_password ? "password-change" : "student"); }
      else { window.location.replace(portalUrl(user.role)); }
    }).catch(() => setState("signed-out"));
  }, []);
  if (state === "checking") return <p role="status">Checking your session…</p>;
  if (state === "password-change" && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
  return state === "student" || state === "password-change" ? <Outlet /> : <Navigate to="/login" replace />;
}
