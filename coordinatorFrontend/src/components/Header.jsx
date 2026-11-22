
import { LogOut } from "lucide-react";
import "./Header.css";

function Header({ onLogout }) {
  return (
    <header className="gcit-header">
      <div className="gcit-header-brand">
        <img
          src="/images/club-logo.png"
          alt="GCIT Clubs Logo"
          className="gcit-header-logo"
        />
      </div>

      <button
        type="button"
        className="gcit-logout-button"
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={20} strokeWidth={1.8} />
      </button>
    </header>
  );
}

export default Header;
