
import { useState } from "react";
import { useEffect } from "react";
import { api } from "../api";
import { CircleAlert, CircleCheck, Trash2, UserRound, Users } from "lucide-react";


export default function EnrollmentRequests() {
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [club, setClub] = useState(null);
  const [editingClub, setEditingClub] = useState(false);
  const [clubDraft, setClubDraft] = useState(null);
  const [clubSaving, setClubSaving] = useState(false);
  const [clubError, setClubError] = useState("");
  const [error, setError] = useState("");
  const reload = () => Promise.all([api("/coordinator/requests"),api("/coordinator/members"),api("/coordinator/leave-requests"),api("/coordinator/club")]).then(([r,m,l,c])=>{setRequests(r);setMembers(m);setLeaveRequests(l);setClub(c)}).catch(e=>setError(e.message));
  useEffect(() => { reload(); }, []);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const filteredRequests = requests.filter((request) =>
    request.status?.toLowerCase() === "pending" &&
    request.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async () => {
    if (!decisionTarget) return;
    setDecisionBusy(true); setDecisionError("");
    try {
      if (decisionTarget.kind === "leave") {
        await api(`/coordinator/leave-requests/${decisionTarget.id}`, {method:"PUT", body:JSON.stringify({decision:decisionTarget.decision})});
        setDecisionTarget(null);
        await reload();
      } else {
        await api(`/coordinator/requests/${decisionTarget.id}`, {method:"PUT", body:JSON.stringify({status:decisionTarget.status.toLowerCase()})});
        const [fresh,approved] = await Promise.all([api("/coordinator/requests"), api("/coordinator/members")]);
        setRequests(fresh); setMembers(approved); setSelected(null); setDecisionTarget(null);
      }
    } catch(e) { setDecisionError(e.message); }
    finally { setDecisionBusy(false); }
  };
  const removeMember = async () => {
    if (!removeTarget) return;
    setRemoveBusy(true); setRemoveError("");
    try { await api(`/coordinator/members/${removeTarget.id}`, {method:"DELETE"}); setRemoveTarget(null); await reload(); }
    catch(e) { setRemoveError(e.message); }
    finally { setRemoveBusy(false); }
  };
  const saveClubProfile = async (event) => {
    event.preventDefault(); setClubSaving(true); setClubError("");
    try { await api("/coordinator/club", {method:"PUT", body:JSON.stringify(clubDraft)}); setEditingClub(false); await reload(); }
    catch(e) { setClubError(e.message); }
    finally { setClubSaving(false); }
  };
  const decisionAccepted = decisionTarget?.kind === "leave" ? decisionTarget.decision === "accept" : decisionTarget?.status === "Approved";
  const decisionHeading = decisionTarget?.kind === "leave"
    ? (decisionAccepted ? "Accept leave request?" : "Reject leave request?")
    : (decisionAccepted ? "Approve enrollment?" : "Reject enrollment?");
  const decisionDescription = !decisionTarget ? null : decisionTarget.kind === "leave"
    ? (decisionAccepted ? <><strong>{decisionTarget.name}</strong> will leave the club and their membership will be closed.</> : <><strong>{decisionTarget.name}</strong> will remain an approved member of your club.</>)
    : (decisionAccepted ? <><strong>{decisionTarget.name}</strong> will become an approved member of your club.</> : <><strong>{decisionTarget.name}</strong>’s enrollment request will be rejected. They will need to submit a new request to join later.</>);
  const decisionDialog = decisionTarget && (
    <div className="poll-modal-overlay">
      <div className="poll-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="enrollment-decision-heading" aria-describedby="enrollment-decision-description">
        <div className={`poll-delete-icon decision-dialog-icon ${decisionAccepted ? "approve" : "reject"}`}>
          {decisionAccepted ? <CircleCheck size={26} /> : <CircleAlert size={26} />}
        </div>
        <h2 id="enrollment-decision-heading">{decisionHeading}</h2>
        <p id="enrollment-decision-description">{decisionDescription}</p>
        {decisionError && <p role="alert">{decisionError}</p>}
        <div className="poll-delete-actions">
          <button type="button" className="poll-edit-cancel" disabled={decisionBusy} onClick={() => setDecisionTarget(null)}>Cancel</button>
          <button type="button" className={`poll-delete-confirm ${decisionAccepted ? "decision-confirm-approved" : ""}`} disabled={decisionBusy} onClick={updateStatus}>{decisionBusy ? "Saving…" : decisionAccepted ? "Confirm" : "Reject"}</button>
        </div>
      </div>
    </div>
  );

  if (selected) {
    return (
      <main className="enrollment-page">
        <header className="enrollment-header">
          <button onClick={() => setSelected(null)}>←</button>
          <h2>Request Details</h2>
        </header>

        <section className="request-detail-card">
          <div className="student-avatar">
            {selected.name.charAt(0)}
          </div>
          <div>
            <h3>{selected.name}</h3>
            <p>{selected.email}</p>
          </div>
          <span className="status">
            {requests.find((r) => r.id === selected.id)?.status}
          </span>
        </section>

        <section className="request-detail-card detail-section">
          <h3>Academic Information</h3>
          <div className="academic-grid">
            <div>Programme: {selected.programme}</div>
            <div>Semester: {selected.semester}</div>
            <div>Enrollment Year: {selected.year}</div>
          </div>
        </section>

        {selected.status === "Pending" && (
          <div className="request-actions">
            <button
              className="reject-button"
              onClick={() => { setDecisionError(""); setDecisionTarget({ kind: "enrollment", id: selected.id, name: selected.name, status: "Rejected" }); }}
            >
              Reject
            </button>
            <button
              className="approve-button"
              onClick={() => { setDecisionError(""); setDecisionTarget({ kind: "enrollment", id: selected.id, name: selected.name, status: "Approved" }); }}
            >
              Approve
            </button>
          </div>
        )}
        {decisionDialog}
      </main>
    );
  }

  return (
    <main className="enrollment-page">
      {error && <p role="alert">{error}</p>}
      {club && <section className="coord-club-profile">
        <img className="coord-club-cover" src={club.cover_image || "/images/club-logo.png"} alt="Club cover" />
        <div className="coord-club-title-row"><div><h2>{club.name}</h2>{club.tagline && <p>{club.tagline}</p>}{club.show_category && club.category && <span className="coord-club-category">{club.category}</span>}</div><button type="button" onClick={()=>{setClubDraft({...club});setClubError("");setEditingClub(true)}}>Edit details</button></div>
        {(club.show_coordinator || club.show_member_count) && <div className="coord-club-facts">
          {club.show_coordinator && <div className="coord-club-fact"><UserRound size={27}/><div><strong>Club Advisors</strong><p>{club.coordinator_name || "Not assigned"}</p></div></div>}
          {club.show_coordinator && club.show_member_count && <span className="coord-club-divider"/>}
          {club.show_member_count && <div className="coord-club-fact"><Users size={29}/><div><strong>Members</strong><p>{club.members} active members</p></div></div>}
        </div>}
        {club.show_about && <div className="coord-club-about"><h3>About the Club</h3><p>{club.description || "Add a description for your club."}</p></div>}
      </section>}
      {editingClub && clubDraft && <div className="poll-modal-overlay"><div className="poll-edit-modal coord-club-edit" role="dialog" aria-modal="true" aria-labelledby="club-profile-edit-title"><div className="poll-modal-heading"><h2 id="club-profile-edit-title">Edit club details</h2><button type="button" aria-label="Close" onClick={()=>setEditingClub(false)}>×</button></div><form onSubmit={saveClubProfile}>
        <label>Club name<input required maxLength={120} value={clubDraft.name} onChange={e=>setClubDraft({...clubDraft,name:e.target.value})}/></label>
        <label>Tagline<input maxLength={240} value={clubDraft.tagline||""} onChange={e=>setClubDraft({...clubDraft,tagline:e.target.value})}/></label>
        <label>Category<input maxLength={100} value={clubDraft.category||""} onChange={e=>setClubDraft({...clubDraft,category:e.target.value})}/></label>
        <label>About<textarea rows="4" maxLength={4000} value={clubDraft.description||""} onChange={e=>setClubDraft({...clubDraft,description:e.target.value})}/></label>
        <label>Cover image URL<input maxLength={2048} placeholder="https://… or /images/…" value={clubDraft.cover_image||""} onChange={e=>setClubDraft({...clubDraft,cover_image:e.target.value})}/></label>
        <div className="coord-club-toggles">{[["show_category","Show category"],["show_coordinator","Show club advisor"],["show_member_count","Show member count"],["show_about","Show About section"]].map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(clubDraft[key])} onChange={e=>setClubDraft({...clubDraft,[key]:e.target.checked})}/>{label}</label>)}</div>
        {clubError && <p role="alert">{clubError}</p>}<div className="poll-delete-actions"><button type="button" className="poll-edit-cancel" disabled={clubSaving} onClick={()=>setEditingClub(false)}>Cancel</button><button type="submit" className="poll-delete-confirm" disabled={clubSaving}>{clubSaving?"Saving…":"Save changes"}</button></div>
      </form></div></div>}
      <header className="enrollment-header">
        <h2>Enrollment Requests</h2>
      </header>

      <input
        className="request-search"
        placeholder="Search students..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="request-list">
        <h2>Pending Requests</h2>
        {filteredRequests.map((request) => (
          <article className="request-card" key={request.id}>
            <div className="student-avatar">
              {request.name.charAt(0)}
            </div>

            <div className="request-info">
              <h3>{request.name}</h3>
              <p>{request.club}</p>
              <span className="status">{request.status}</span>
              <button onClick={() => setSelected(request)}>
                Review
              </button>
            </div>
          </article>
        ))}

        {filteredRequests.length === 0 && (
          <p>No pending requests.</p>
        )}
      </div>

      <section className="request-list">
        <h2>Leave Requests</h2>
        {leaveRequests.map(m => <article className="request-card" key={m.id}><div className="student-avatar">{m.name.charAt(0)}</div><div className="request-info"><h3>{m.name}</h3><p>{m.email}</p><button onClick={()=>{setDecisionError("");setDecisionTarget({kind:"leave",id:m.id,name:m.name,decision:"reject"})}}>Reject</button><button onClick={()=>{setDecisionError("");setDecisionTarget({kind:"leave",id:m.id,name:m.name,decision:"accept"})}}>Accept</button></div></article>)}
        {leaveRequests.length===0 && <p>No pending leave requests.</p>}
      </section>
      <section className="request-list">
        <h2>Members</h2>
        {members.map(member => <article className="request-card" key={member.id}><div className="student-avatar">{member.name.charAt(0)}</div><div className="request-info"><h3>{member.name}</h3><p>{member.email}</p><span className="status">{member.status === "leave_requested" ? "Leave requested" : "Approved Member"}</span><button className="member-remove-button" onClick={()=>{setRemoveTarget(member);setRemoveError("")}}>Remove</button></div></article>)}
        {members.length === 0 && <p>No approved members yet.</p>}
      </section>
      {removeTarget && <div className="poll-modal-overlay"><div className="poll-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="remove-member-heading" aria-describedby="remove-member-description">
        <div className="poll-delete-icon"><Trash2 size={26} /></div>
        <h2 id="remove-member-heading">Remove member?</h2>
        <p id="remove-member-description">Remove <strong>{removeTarget.name}</strong> from your club? They will need to submit a new request to join again.</p>
        <p>This action cannot be undone.</p>
        {removeError && <p role="alert">{removeError}</p>}
        <div className="poll-delete-actions">
          <button type="button" className="poll-edit-cancel" disabled={removeBusy} onClick={()=>setRemoveTarget(null)}>Cancel</button>
          <button type="button" className="poll-delete-confirm" disabled={removeBusy} onClick={removeMember}>{removeBusy ? "Removing…" : "Remove member"}</button>
        </div>
      </div></div>}
      {decisionDialog}
    </main>
  );
}
