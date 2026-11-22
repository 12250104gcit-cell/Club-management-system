import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, KeyRound } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <>
      <div className="sub-header">
        <button type="button" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft size={30} />
        </button>
        <h2>Settings</h2>
      </div>

      <h3 className="group-heading big">Account</h3>

      <Link to="/change-password" className="settings-row">
        <KeyRound size={26} />
        <span>Change Password</span>
        <ChevronRight size={24} className="chev" />
      </Link>
    </>
  );
}
