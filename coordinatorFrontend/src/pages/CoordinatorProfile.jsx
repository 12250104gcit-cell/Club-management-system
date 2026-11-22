
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Settings,
  CircleHelp,
  UserRound,
  KeyRound,
  Mail,
  Bell,
  Phone,
  Users,
  GraduationCap,
  Save,
  Pencil,
} from "lucide-react";
import { api } from "../api";


function CoordinatorProfile({ currentUser, onProfileUpdated }) {
  const [page, setPage] = useState("profile");

  const accountProfile = {
    name: currentUser?.full_name || currentUser?.name || currentUser?.email || "Coordinator",
    email: currentUser?.email || "",
    role: "Club Coordinator",
    programme: currentUser?.programme || "",
    module: currentUser?.module || "",
    dob: currentUser?.date_of_birth || "",
    gender: currentUser?.gender || "",
  };
  const [profile, setProfile] = useState(accountProfile);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [profileDraft, setProfileDraft] = useState({
    full_name: currentUser?.full_name || currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    date_of_birth: currentUser?.date_of_birth || "",
    gender: currentUser?.gender || "",
    programme: currentUser?.programme || "",
    module: currentUser?.module || "",
    year_semester: currentUser?.year_semester || "",
    enrollment_number: currentUser?.enrollment_number || "",
    enrolment_year: currentUser?.enrolment_year || "",
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let active = true;
    api("/auth/profile").then((data) => {
      if (!active) return;
      setProfile({ name: data.full_name, email: data.email, role: "Club Coordinator", programme: data.programme || "", module: data.module || "", dob: data.date_of_birth || "", gender: data.gender || "" });
      setEmailInput(data.email || "");
      setProfileDraft(data);
    }).catch(() => {
      if (active) setProfile((previous) => ({ ...previous, ...accountProfile }));
    });
    return () => { active = false; };
  }, [currentUser?.user_id, currentUser?.full_name, currentUser?.email, currentUser?.programme, currentUser?.module, currentUser?.date_of_birth, currentUser?.gender]);
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [message, setMessage] = useState("");

  const goTo = (destination) => {
    setMessage("");
    setPage(destination);
  };

  const goBack = () => {
    if (["password", "email", "notification"].includes(page)) {
      goTo("settings");
    } else {
      goTo("profile");
    }
  };

  const saveEmail = async (event) => {
    event.preventDefault();
    try {
      const saved = await api("/auth/profile", { method: "PUT", body: JSON.stringify({ ...profileDraft, full_name: profile.name, email: emailInput.trim() }) });
      setProfileDraft(saved);
      setProfile((previous) => ({ ...previous, name: saved.full_name, email: saved.email }));
      setEmailInput(saved.email);
      document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(saved))}; Path=/; SameSite=Lax; Max-Age=86400`;
      onProfileUpdated?.(saved);
      setMessage("Email updated.");
    } catch (error) { setMessage(error.message || "Could not update email."); }
  };

  const savePersonalInfo = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");
    try {
      const saved = await api("/auth/profile", { method: "PUT", body: JSON.stringify(profileDraft) });
      setProfileDraft(saved);
      setProfile({ name: saved.full_name, email: saved.email, role: "Club Coordinator", programme: saved.programme || "", module: saved.module || "", dob: saved.date_of_birth || "", gender: saved.gender || "" });
      setEmailInput(saved.email);
      document.cookie = `club_user_share=${encodeURIComponent(JSON.stringify(saved))}; Path=/; SameSite=Lax; Max-Age=86400`;
      onProfileUpdated?.(saved);
      setEditingProfile(false);
      setMessage("Personal information saved.");
    } catch (error) { setMessage(error.message || "Could not save personal information."); }
    finally { setSavingProfile(false); }
  };

  const savePassword = (event) => {
    event.preventDefault();

    if (passwords.newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirm) {
      setMessage("New passwords do not match.");
      return;
    }

    // No real password change until connected to the backend
    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });

    setMessage(
      "Form validated. Backend connection is required to change the password."
    );
  };

  const titles = {
    profile: "Profile",
    settings: "Settings",
    about: "About Us",
    personal: "Profile",
    password: "Change Password",
    email: "Update Email",
    notification: "Notification",
  };

  return (
    <main className="coordinator-profile-page">
      <header className="coordinator-profile-heading">
        {page !== "profile" && (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <h2>{titles[page]}</h2>
      </header>

      {/* MAIN PROFILE SCREEN */}
      {page === "profile" && (
        <>
          <section className="coordinator-profile-summary">
            <div className="coordinator-avatar">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <h3>{profile.name}</h3>
            <p>{profile.role}</p>
          </section>

          <section className="coordinator-profile-menu">
            <button
              type="button"
              onClick={() => goTo("settings")}
            >
              <Settings size={18} />
              <span>Settings</span>
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => goTo("about")}
            >
              <CircleHelp size={18} />
              <span>About us</span>
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => goTo("personal")}
            >
              <UserRound size={18} />
              <span>Personal information</span>
              <ChevronRight size={18} />
            </button>
          </section>
        </>
      )}

      {/* SETTINGS SCREEN */}
      {page === "settings" && (
        <section className="coordinator-settings">
          <h3>Account</h3>

          <button
            type="button"
            onClick={() => goTo("password")}
          >
            <KeyRound size={18} />
            Change Password
          </button>

          <button
            type="button"
            onClick={() => {
              setEmailInput(profile.email);
              goTo("email");
            }}
          >
            <Mail size={18} />
            Update email
          </button>

          <button
            type="button"
            onClick={() => goTo("notification")}
          >
            <Bell size={18} />
            Notification
          </button>
        </section>
      )}

      {/* ABOUT US SCREEN */}
      {page === "about" && (
        <section className="coordinator-about">
          <div className="coordinator-about-image">
            <Users size={42} />
            <span>Integrity Club</span>
          </div>

          <h3>Integrity Club</h3>
          <p className="coordinator-about-subtitle">
            Accountability through Digital Visibility
          </p>

          <div className="coordinator-about-stats">
            <div>
              <GraduationCap size={18} />
              <span>Club Advisors</span>
            </div>

            <div>
              <Users size={18} />
              <span>Members</span>
            </div>
          </div>

          <h4>About the Club</h4>

          <p>
            The Integrity Club is a student-led club that
            encourages honesty, accountability, teamwork
            and responsible behaviour.
          </p>

          <p>
            The club provides opportunities for students
            to participate in activities, share ideas
            and contribute to their college community.
          </p>

          <div className="coordinator-about-contact">
            <h4>Contact Information</h4>

            <div>
              <Phone size={16} />
              <span>Contact details to be added</span>
            </div>

            <div>
              <Mail size={16} />
              <span>Official club email to be added</span>
            </div>
          </div>
        </section>
      )}

      {/* PERSONAL INFORMATION SCREEN */}
      {page === "personal" && (
        <section className="coordinator-personal">
          <div className="coordinator-personal-top">
            <div className="coordinator-avatar small">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div>
              <h3>{profile.name}</h3>
              <p>{profile.email}</p>
              <p>{profile.role}</p>
            </div>
          </div>

          <div className="coordinator-info-divider" />

          {editingProfile ? (
            <form className="coordinator-settings-form" onSubmit={savePersonalInfo}>
              {[
                ["full_name", "Full Name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"],
                ["date_of_birth", "Date of Birth", "date"], ["gender", "Gender", "text"],
                ["programme", "Programme", "text"], ["module", "Module", "text"],
                ["year_semester", "Year / Semester", "text"], ["enrollment_number", "Enrollment number", "text"], ["enrolment_year", "Enrolment Year", "text"],
              ].map(([field, label, type]) => (
                <label key={field} htmlFor={`profile-${field}`}>{label}
                  <input id={`profile-${field}`} type={type} value={profileDraft[field] || ""} required={field === "full_name" || field === "email"} onChange={(event) => setProfileDraft((value) => ({ ...value, [field]: event.target.value }))} />
                </label>
              ))}
              <button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Personal Information"}</button>
              <button type="button" onClick={() => { setProfileDraft({ ...profileDraft, full_name: profile.name, email: profile.email }); setEditingProfile(false); }}>Cancel</button>
            </form>
          ) : (
            <>
              <h4>Academic Information</h4>
              <div className="coordinator-info-card">
                <div><strong>Programme</strong><span>{profile.programme || "Not provided"}</span></div>
                <div><strong>Module</strong><span>{profile.module || "Not provided"}</span></div>
                <div><strong>Year / Semester</strong><span>{profileDraft.year_semester || "Not provided"}</span></div>
                <div><strong>Enrollment number</strong><span>{profileDraft.enrollment_number || "Not provided"}</span></div>
                <div><strong>Enrolment Year</strong><span>{profileDraft.enrolment_year || "Not provided"}</span></div>
              </div>

              <h4>Basic Information</h4>
              <div className="coordinator-info-card">
                <div><strong>Full Name</strong><span>{profile.name}</span></div>
                <div><strong>Email</strong><span>{profile.email || "Not provided"}</span></div>
                <div><strong>Phone</strong><span>{profileDraft.phone || "Not provided"}</span></div>
                <div><strong>Date of Birth</strong><span>{profile.dob || "Not provided"}</span></div>
                <div><strong>Gender</strong><span>{profile.gender || "Not provided"}</span></div>
              </div>
              <button type="button" className="create-announcement-button" onClick={() => { setProfileDraft((value) => ({ ...value, full_name: profile.name, email: profile.email })); setEditingProfile(true); }}><Pencil size={16} />Edit Personal Information</button>
            </>
          )}
          {message && <p role="status">{message}</p>}
        </section>
      )}

      {/* CHANGE PASSWORD SCREEN */}
      {page === "password" && (
        <form
          className="coordinator-settings-form"
          onSubmit={savePassword}
        >
          <label htmlFor="current-password">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={passwords.current}
            onChange={(event) =>
              setPasswords({
                ...passwords,
                current: event.target.value,
              })
            }
            required
          />

          <label htmlFor="new-password">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={passwords.newPassword}
            onChange={(event) =>
              setPasswords({
                ...passwords,
                newPassword: event.target.value,
              })
            }
            required
          />

          <label htmlFor="confirm-password">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={passwords.confirm}
            onChange={(event) =>
              setPasswords({
                ...passwords,
                confirm: event.target.value,
              })
            }
            required
          />

          <button type="submit">
            <Save size={16} />
            Change Password
          </button>

          {message && <p role="status">{message}</p>}
        </form>
      )}

      {/* UPDATE EMAIL SCREEN */}
      {page === "email" && (
        <form
          className="coordinator-settings-form"
          onSubmit={saveEmail}
        >
          <label htmlFor="coordinator-email">
            Email Address
          </label>

          <input
            id="coordinator-email"
            type="email"
            value={emailInput}
            onChange={(event) =>
              setEmailInput(event.target.value)
            }
            required
          />

          <button type="submit">
            <Save size={16} />
            Save Email
          </button>

          {message && <p role="status">{message}</p>}
        </form>
      )}

      {/* NOTIFICATION SCREEN */}
      {page === "notification" && (
        <section className="coordinator-notifications">
          <h3>Notification Preferences</h3>

          <label>
            <span>Enable Notifications</span>

            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(event) =>
                setNotificationsEnabled(event.target.checked)
              }
            />
          </label>

          <p>
            This setting currently controls only the
            frontend demonstration.
          </p>
        </section>
      )}
    </main>
  );
}

export default CoordinatorProfile;
