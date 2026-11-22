import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ListChecks, Megaphone, TextSearch } from "lucide-react";
import { announcements, clubs as staticClubs, STUDENT } from "../data/appData";
import { getCurrentUser } from "../data/storage";
import { api } from "../data/api";
import ClubLogo from "../components/ClubLogo";

export default function Dashboard() {
  const [club, setClub] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  useEffect(() => { Promise.all([api("/clubs"),api("/student/requests")]).then(([clubs,requests]) => { const active=requests.find(r=>r.status==="approved"||r.status==="pending"); setPending(active?.status==="pending"); if(active?.status==="approved"){const row=clubs.find(c=>c.id===active.club_id);const visual=staticClubs.find(c=>c.id===Number(active.club_id));if(row)setClub({...visual,...row,image:visual?.image||"/logo.png",logo:visual?.logo||"/logo.png"});} }).catch(e=>setError(e.message)).finally(() => setLoading(false)); },[]);
  const list = club
    ? announcements.filter((a) => a.clubId === club.id)
    : [];

  return (
    <>
      <div className="dashboard-header">
        <div>
          <p>Welcome back</p>
          <h1>{user?.name || STUDENT.name}</h1>
        </div>
      </div>

      {loading ? <p className="center-note full" role="status">Loading your dashboard…</p> : club ? (
        <section className="hero-card">
          <h2 className="hero-title">MY CLUB</h2>
          <div className="hero-club-box">
            <ClubLogo club={club} />
          </div>
          <div className="hero-actions">
            <Link to="/announcements" className="btn-green-small">
              <Megaphone size={18} />
              Announcements
            </Link>
            <Link to="/polls" className="btn-green-small">
              <ListChecks size={18} />
              View Polls
            </Link>
          </div>
        </section>
      ) : (
        <section className="hero-card hero-empty">
          <img src="/logo.png" alt="GCIT Clubs" className="hero-empty-image" />
          <p>
            {pending
              ? "Your club request is pending approval"
              : "You haven't joined a club yet"}
          </p>
          <Link to="/clubs" className="btn-green-small">
            <TextSearch size={18} />
            {pending ? "View Clubs" : "Find a Club"}
          </Link>
        </section>
      )}
      {error && <p role="alert">{error}</p>}

      {!loading && <>
        <h2 className="section-heading">Announcements</h2>
        {club ? (
          <div className="list-card">
            {list.map((item) => (
              <Link to="/announcements" className="list-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.short}</p>
                </div>
                <ArrowRight size={22} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="locked-card">
            <p>Join a club to access this feature...</p>
          </div>
        )}
      </>}
    </>
  );
}
