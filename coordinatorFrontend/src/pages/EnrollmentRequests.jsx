
import { useState } from "react";
import { useEffect } from "react";
import { api } from "../api";


export default function EnrollmentRequests() {
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api("/coordinator/requests"),api("/coordinator/members")]).then(([r,m])=>{setRequests(r);setMembers(m)}).catch(e=>setError(e.message)); }, []);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filteredRequests = requests.filter((request) =>
    request.status?.toLowerCase() === "pending" &&
    request.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id, status) => {
    try { await api(`/coordinator/requests/${id}`,{method:"PUT",body:JSON.stringify({status:status.toLowerCase()})}); const [fresh,approved]=await Promise.all([api("/coordinator/requests"),api("/coordinator/members")]); setRequests(fresh);setMembers(approved);setSelected(null); }
    catch(e){setError(e.message)}
  };

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

        <section className="request-detail-card detail-section">
          <h3>Why do you want to join this club?</h3>
          <p>{selected.reason}</p>
        </section>

        {selected.status === "Pending" && (
          <div className="request-actions">
            <button
              className="reject-button"
              onClick={() => updateStatus(selected.id, "Rejected")}
            >
              Reject
            </button>
            <button
              className="approve-button"
              onClick={() => updateStatus(selected.id, "Approved")}
            >
              Approve
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="enrollment-page">
      {error && <p role="alert">{error}</p>}
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
        <h2>Club Members</h2>
        {members.map(member => <article className="request-card" key={member.id}><div className="student-avatar">{member.name.charAt(0)}</div><div className="request-info"><h3>{member.name}</h3><p>{member.email}</p><span className="status">Approved Member</span></div></article>)}
        {members.length === 0 && <p>No approved members yet.</p>}
      </section>
    </main>
  );
}
