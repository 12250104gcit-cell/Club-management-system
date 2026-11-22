import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../data/storage";

export default function Welcome() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("splash");

  useEffect(() => {
    if (getCurrentUser()) {
      navigate("/", { replace: true });
      return;
    }
    const timer = setTimeout(() => setStage("start"), 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome">
      {stage === "splash" ? (
        <div className="splash">
          <img src="/logo.png" alt="GCIT Clubs" className="splash-logo" />
          <h1>GCIT CLUBS</h1>
          <p>Manage | Connect | Participate</p>
        </div>
      ) : (
        <div className="start">
          <div className="start-hero">
            <div className="start-logo">
              <img src="/logo.png" alt="GCIT Clubs" />
            </div>
          </div>
          <h1>GCIT CLUBS</h1>
          <p>Manage | Connect | Participate</p>
          <button
            type="button"
            className="btn-green start-button"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
      )}

      <footer className="welcome-footer">GCIT Club Management App</footer>
    </div>
  );
}
