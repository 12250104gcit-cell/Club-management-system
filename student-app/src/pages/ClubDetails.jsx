import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Mail, Phone, Undo2, UserRound, Users } from "lucide-react";
import { clubs as staticClubs } from "../data/appData";
import { api } from "../data/api";
import Modal from "../components/Modal";

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);

  const refresh = async () => {
    const [all, own] = await Promise.all([api("/clubs"), api("/student/requests")]);
    const row = all.find((item) => String(item.id) === String(id));
    const visual = staticClubs.find((item) => item.id === Number(id));
    setClub(row ? { ...visual, ...row, short: row.description, tagline: row.tagline || row.description, image: row.cover_image || visual?.image || "/logo.png", advisors: visual?.advisors || [row.coordinator_name || "Club Coordinator"], members: [], activeMembers: row.members } : null);
    setRequests(own);
  };
  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [id]);

  if (!club && !error) return <p className="center-note">Loading club…</p>;
  if (!club) return <><Link to="/clubs" className="back-arrow" aria-label="Back"><ChevronLeft size={30} /></Link><p className="center-note">{error || "Club not found."}</p></>;

  const application = requests.find((a) => a.club_id === club.id);
  const active = requests.find((a) => ["pending", "approved", "leave_requested"].includes(a.status));
  const blocked = Boolean(active && active.club_id !== club.id);
  const buttonText = application?.status === "approved" ? "Member" : application?.status === "pending" ? "Applied" : application?.status === "rejected" ? "Request again" : "Apply";
  const disabled = busy || Boolean(blocked || application?.status === "pending" || application?.status === "approved");
  const submitApplication = async () => {
    setBusy(true); setError("");
    try { await api("/student/requests", { method: "POST", body: JSON.stringify({ club_id: club.id }) }); await refresh(); setStep("success"); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const submitLeaveRequest = async () => {
    setBusy(true); setError("");
    try { await api("/student/leave-request", { method: "POST" }); await refresh(); setStep("leave-success"); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return <>
    <button type="button" className="back-arrow" aria-label="Back" onClick={() => navigate(-1)}><ChevronLeft size={30} /></button>
    <img src={club.image} alt={club.name} className="club-cover" />
    <div className="club-head"><div><h2>{club.name}</h2><p>{club.tagline}</p>{club.show_category && club.category && <small>{club.category}</small>}</div>{application?.status === "approved" ? <button type="button" className="btn-red apply-btn leave-action-btn" disabled={busy} onClick={() => setStep("leave-confirm")}>Request to leave</button> : application?.status === "leave_requested" ? <span className="leave-requested-label">Leave requested</span> : <button type="button" className="btn-green-small apply-btn" disabled={disabled} onClick={() => setStep("confirm")}>{buttonText}</button>}</div>
    {blocked && <p>Leave your current club before joining another.</p>}{error && <p role="alert">{error}</p>}
    {(club.show_coordinator !== false || club.show_member_count !== false) && <div className="club-facts">{club.show_coordinator !== false && <div className="fact"><UserRound size={30} /><div><strong>Club Advisors</strong><p>{club.coordinator_name || club.advisors.join(", ")}</p></div></div>}{club.show_coordinator !== false && club.show_member_count !== false && <div className="fact-divider" />}{club.show_member_count !== false && <div className="fact"><Users size={30} /><div><strong>Members</strong><p>{club.activeMembers ? `${club.activeMembers} active members` : "Not available"}</p></div></div>}</div>}
    {club.show_about !== false && <><h3 className="about-heading">About the Club</h3><p className="about-text">{club.description}</p></>}
    <div className="contact-block"><div><Phone size={22} /><span>{club.phone || ""}</span></div><div><Mail size={22} /><span>{club.email || ""}</span></div></div>
    {step === "confirm" && <Modal variant="warning" title="Are You Sure?" lines={["Are you sure you want to apply to this club", "This action cannot be undone"]}><button type="button" className="btn-yellow" disabled={busy} onClick={submitApplication}>{busy ? "Sending…" : "Confirm"}</button><button type="button" className="btn-outline" onClick={() => setStep(null)}><Undo2 size={16} />Go Back</button></Modal>}
    {step === "success" && <Modal variant="success" title="Success" lines={["Request has been sent to club coordinator", "Please wait for their response"]}><button type="button" className="btn-green" onClick={() => setStep(null)}>Confirm</button></Modal>}
    {step === "leave-confirm" && <Modal variant="danger" title="Request to leave this club?" lines={["Your coordinator will review this request.", "You’ll remain a member until it is approved.", ...(error ? [error] : [])]}><button type="button" className="btn-red" disabled={busy} onClick={submitLeaveRequest}>{busy ? "Sending…" : "Confirm request"}</button><button type="button" className="btn-outline" disabled={busy} onClick={() => setStep(null)}><Undo2 size={16} />Cancel</button></Modal>}
    {step === "leave-success" && <Modal variant="success" title="Request sent" lines={["Your request to leave has been sent to the coordinator."]}><button type="button" className="btn-green" onClick={() => setStep(null)}>Done</button></Modal>}
  </>;
}
