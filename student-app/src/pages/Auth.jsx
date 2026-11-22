import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { saveAuthSession, saveSharedAuthToken } from "../data/storage";
import { api, portalUrl } from "../data/api";

export default function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/auth/me").then(user => {
      if (user.role === "student") { saveAuthSession("", user); navigate(user.must_change_password ? "/change-password" : "/", { replace: true }); }
      else window.location.replace(portalUrl(user.role));
    }).catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formattedEmail = email.trim().toLowerCase();

    if (!isLogin) {
      if (password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      try {
        await api("/auth/register", { method: "POST", body: JSON.stringify({ full_name: fullName.trim(), email: formattedEmail, password }) });
        const loginData = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: formattedEmail, password }) });
        saveSharedAuthToken(loginData.token, loginData.user);
        if (loginData.user.role === "student") { saveAuthSession(loginData.token, loginData.user); navigate("/", { replace: true }); }
        else window.location.replace(portalUrl(loginData.user.role));
      } catch (e) {
        setError(e.message || "Could not connect to the server.");
      }
      return;
    }

    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: formattedEmail, password }) });
      saveSharedAuthToken(data.token, data.user);

      if (data.user.role === "student") { saveAuthSession(data.token, data.user); navigate(data.user.must_change_password ? "/change-password" : "/", { replace: true }); }
      else window.location.replace(portalUrl(data.user.role));
    } catch (e) {
      setError(e.message || "Could not connect to the server.");
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
  };

  return (
    <div className="auth">
      <div className="auth-inner">
        <div className="auth-brand">
          <div className="auth-brand-row">
            <img src="/logo.png" alt="" />
            <h1>GCIT CLUBS</h1>
          </div>
          <p>Manage | Connect | Participate</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label className="auth-label" htmlFor="auth-full-name">
                Full Name
              </label>
              <input
                id="auth-full-name"
                className="pill-input"
                type="text"
                placeholder="Enter Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </>
          )}

          <label className="auth-label" htmlFor="auth-email">
            Email Address
          </label>
          <input
            id="auth-email"
            className="pill-input"
            type="email"
            placeholder="Enter Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label" htmlFor="auth-password">
            Password
          </label>
          <div className="pill-input-wrap">
            <input
              id="auth-password"
              className="pill-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="pill-eye"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {!isLogin && (
            <>
              <label className="auth-label" htmlFor="auth-confirm">
                Confirm Password
              </label>
              <input
                id="auth-confirm"
                className="pill-input"
                type="password"
                placeholder="Re-Enter Your Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-green-pill">
            {isLogin ? "LOGIN" : "SIGN UP"}
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-pill"
            onClick={() =>
              alert("Google authentication will be connected later.")
            }
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
            />
            {isLogin ? "Sign in with Google" : "Sign Up with Google"}
          </button>

          <p className="auth-switch">
            {isLogin ? "Dont have an account yet? " : "Already have an account? "}
            <button type="button" onClick={switchMode}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>

      <footer className="welcome-footer">GCIT Club Management App</footer>
    </div>
  );
}
