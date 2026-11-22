import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Undo2 } from "lucide-react";
import { getAuthToken } from "../data/storage";
import Modal from "../components/Modal";

function PasswordField({ placeholder, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="cp-field">
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
    </div>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(null); // null | "confirm" | "success"

  const validate = () => {
    setError("");
    if (!current || !next || !confirm) {
      setError("Please fill in all the fields.");
      return;
    }
    if (next.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirm password do not match.");
      return;
    }
    setStep("confirm");
  };

  const changePassword = async () => {
    setError("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          current_password: current,
          new_password: next
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setStep(null);
        setError(data.error || "Password change failed.");
        return;
      }

      setStep("success");
    } catch {
      setStep(null);
      setError("Could not connect to the server.");
    }
  };

  return (
    <div className="app-shell plain">
      <div className="phone cp-page">
        <button
          type="button"
          className="back-arrow"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={30} />
        </button>

        <img src="/logo.png" alt="" className="cp-logo" />

        <div className="cp-form">
          <PasswordField placeholder="Current Password" value={current} onChange={setCurrent} />
          <PasswordField placeholder="New Password" value={next} onChange={setNext} />
          <PasswordField placeholder="Confirm Password" value={confirm} onChange={setConfirm} />

          {error && <div className="auth-error">{error}</div>}

          <button type="button" className="cp-confirm" onClick={validate}>
            Confirm
          </button>
        </div>

        {step === "confirm" && (
          <Modal
            variant="warning"
            title="Are You Sure?"
            lines={[
              "Are you sure you want to change your password",
              "This action cannot be undone"
            ]}
          >
            <button type="button" className="btn-yellow" onClick={changePassword}>
              Confirm
            </button>
            <button type="button" className="btn-outline" onClick={() => setStep(null)}>
              <Undo2 size={16} />
              Go Back
            </button>
          </Modal>
        )}

        {step === "success" && (
          <Modal
            variant="success"
            title="Success"
            lines={[
              "Your password has been changed",
              "and updated successfully"
            ]}
          >
            <button
              type="button"
              className="btn-green"
              onClick={() => navigate("/settings", { replace: true })}
            >
              Confirm
            </button>
          </Modal>
        )}
      </div>
    </div>
  );
}
