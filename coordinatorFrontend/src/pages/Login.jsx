import { useEffect } from "react";

export default function Login() {
  useEffect(() => {
    const sharedLogin = import.meta.env.VITE_SHARED_LOGIN_URL || `${window.location.protocol}//${window.location.hostname}:5173/login`;
    window.location.replace(sharedLogin);
  }, []);
  return <div className="login-container" role="status">Opening the shared GCIT Clubs sign in…</div>;
}
