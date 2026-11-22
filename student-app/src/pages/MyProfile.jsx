import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { clubs } from "../data/appData";
import { saveCurrentProfile, useApplications } from "../data/storage";
import { api } from "../data/api";

const EMPTY_PROFILE = {
  full_name: "", email: "", phone: "", date_of_birth: "", gender: "",
  programme: "", module: "", year_semester: "", enrollment_number: "", enrolment_year: "",
};

function InfoCard({ rows }) {
  return <div className="data-card">{rows.map(([label, value]) => <div key={label}><strong>{label}</strong><span>{value || "Not provided"}</span></div>)}</div>;
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { approved } = useApplications();
  const club = approved ? clubs.find((c) => c.id === approved.clubId) : null;
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/auth/profile").then((data) => {
      setProfile({ ...EMPTY_PROFILE, ...data });
      setDraft({ ...EMPTY_PROFILE, ...data });
    }).catch((e) => setError(e.message || "Could not load your profile.")).finally(() => setLoading(false));
  }, []);

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await api("/auth/profile", { method: "PUT", body: JSON.stringify(draft) });
      setProfile({ ...EMPTY_PROFILE, ...saved });
      setDraft({ ...EMPTY_PROFILE, ...saved });
      saveCurrentProfile(saved);
      setEditing(false);
    } catch (e) { setError(e.message || "Could not save your profile."); }
    finally { setSaving(false); }
  };

  const fields = [
    ["full_name", "Full Name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"],
    ["date_of_birth", "Date of Birth", "date"], ["gender", "Gender", "text"],
    ["programme", "Programme", "text"], ["module", "Module", "text"],
    ["year_semester", "Year / Semester", "text"], ["enrollment_number", "Enrollment number", "text"], ["enrolment_year", "Enrolment Year", "text"],
  ];

  return (
    <>
      <div className="sub-header">
        <button type="button" aria-label="Back" onClick={() => navigate(-1)}><ChevronLeft size={30} /></button>
        <h2>Profile</h2>
      </div>
      {loading ? <p role="status">Loading profile…</p> : error && !profile.full_name ? <p className="auth-error" role="alert">{error}</p> : <>
        <div className="me-top">
          <div><h3>{profile.full_name || "Account"}</h3><p>Account ID: {profile.user_id}</p>{club && <p>{club.name} Member</p>}</div>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {editing ? <form onSubmit={save} className="profile-edit-form">
          {fields.map(([field, label, type]) => <label className="auth-label" key={field}>{label}<input className="pill-input" type={type} value={draft[field] || ""} onChange={(e) => update(field, e.target.value)} required={field === "full_name" || field === "email"} /></label>)}
          <div className="modal-row"><button className="btn-green" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button><button className="btn-outline-small" type="button" onClick={() => { setDraft(profile); setEditing(false); setError(""); }}>Cancel</button></div>
        </form> : <>
          <h3 className="group-heading">Basic Information</h3>
          <InfoCard rows={[["Full Name", profile.full_name], ["Email", profile.email], ["Phone", profile.phone], ["Date of Birth", profile.date_of_birth], ["Gender", profile.gender]]} />
          <h3 className="group-heading">Academic Information</h3>
          <InfoCard rows={[["Programme", profile.programme], ["Module", profile.module], ["Year / Semester", profile.year_semester], ["Enrollment number", profile.enrollment_number], ["Enrolment Year", profile.enrolment_year]]} />
          <button className="profile-edit-button" type="button" onClick={() => { setDraft(profile); setEditing(true); }}><Pencil size={16} />Edit Personal Information</button>
        </>}
      </>}
    </>
  );
}
