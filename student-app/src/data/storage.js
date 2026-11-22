import { useEffect, useState } from "react";

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const getUsers = () => read("users", []);
export const saveUsers = (users) =>
  localStorage.setItem("users", JSON.stringify(users));

export const getCurrentUser = () => read("currentUser", null);
const sharedToken = () => document.cookie.split("; ").find((part) => part.startsWith("club_token_share="))?.slice("club_token_share=".length) || "";
const setSharedToken = (token) => { document.cookie = `club_token_share=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=86400`; };
const setSharedIdentity = (user) => { if (user) document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify({ user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }))}; Path=/; SameSite=Lax; Max-Age=86400`; };
export const clearCurrentUser = () => { localStorage.removeItem("currentUser"); localStorage.removeItem("authToken"); document.cookie = "club_token_share=; Path=/; SameSite=Lax; Max-Age=0"; document.cookie = "club_user_share=; Path=/; SameSite=Lax; Max-Age=0"; };
export const getAuthToken = () => localStorage.getItem("authToken") || decodeURIComponent(sharedToken());
export const saveSharedAuthToken = (token, user) => { if (token) setSharedToken(token); setSharedIdentity(user); };
export const saveCurrentProfile = (user) => {
  setSharedIdentity(user);
  localStorage.setItem("currentUser", JSON.stringify({ id: user.user_id, name: user.full_name, email: user.email, role: user.role }));
};
export const saveAuthSession = (token, user) => {
  if (token) { localStorage.setItem("authToken", token); setSharedToken(token); }
  setSharedIdentity(user);
  localStorage.setItem(
    "currentUser",
    JSON.stringify({ id: user.user_id, name: user.full_name, email: user.email, role: user.role })
  );
};

export const getApplications = () => read("applications", []);
export const getVotes = () => read("pollVotes", {});
export const saveVotes = (votes) =>
  localStorage.setItem("pollVotes", JSON.stringify(votes));

// Applications, kept in sync with localStorage
export function useApplications() {
  const [applications, setApplications] = useState(getApplications);

  useEffect(() => {
    const refresh = () => setApplications(getApplications());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const update = (next) => {
    localStorage.setItem("applications", JSON.stringify(next));
    setApplications(next);
  };

  const approved = applications.find((a) => a.status === "Approved") || null;
  const pending = applications.find((a) => a.status === "Pending") || null;

  return { applications, update, approved, pending };
}
