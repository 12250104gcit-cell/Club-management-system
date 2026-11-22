import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CircleUserRound, LogOut, Settings } from "lucide-react";
import { STUDENT } from "../data/appData";
import { clearCurrentUser, getCurrentUser } from "../data/storage";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { api } from "../data/api";

export default function Profile() {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const currentUser = getCurrentUser();

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    clearCurrentUser();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <h2 className="page-title">Profile</h2>

      <div className="profile-summary">
        <Avatar size={94} />
        <h3>{currentUser?.name || STUDENT.name}</h3>
        <p>{currentUser?.email || STUDENT.studentId}</p>
      </div>

      <div className="profile-menu">
        <Link to="/profile/me" className="profile-row">
          <CircleUserRound size={28} />
          <span>My Profile</span>
          <ChevronRight size={24} className="chev" />
        </Link>
        <Link to="/settings" className="profile-row">
          <Settings size={28} />
          <span>Settings</span>
          <ChevronRight size={24} className="chev" />
        </Link>
        <button
          type="button"
          className="profile-row no-border"
          onClick={() => setConfirmLogout(true)}
        >
          <LogOut size={28} />
          <span>Log Out</span>
        </button>
      </div>

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
    </>
  );
}
