import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Users } from "lucide-react";
import { api } from "../data/api";
import ClubLogo from "../components/ClubLogo";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([api("/clubs"), api("/student/requests")]).then(([c, r]) => { setClubs(c); setRequests(r); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const myApplication = requests.find(r => r.status === "approved" || r.status === "pending");
  const myClub = myApplication ? clubs.find(c => c.id === myApplication.club_id) : null;

  return (
    <>
      {!loading && myClub ? (
        <>
          <h2 className="section-heading light">My Club</h2>

          <Link to={`/clubs/${myClub.id}`} className="my-club-card">
            <div className="my-club-top">
              <ClubLogo club={myClub} className="my-club-logo" />
              <div>
                <strong>{myClub.name}</strong>
                <p>{myClub.description}</p>
                {myClub.activeMembers && (
                  <span className="members-line">
                    <Users size={14} />
                    {myClub.activeMembers} active members
                  </span>
                )}
              </div>
            </div>

            {myApplication.status === "pending" && (
              <div className="pending-bar">
                <span>
                  <Clock size={16} />
                  {myApplication.status === "pending" ? "Approval Pending" : "Membership approved"}
                </span>
                <span className="pending-pill">{myApplication.status}</span>
              </div>
            )}
          </Link>

          <h2 className="section-heading light">Other Clubs</h2>
        </>
      ) : !loading ? (
        <h2 className="find-heading">FIND A CLUB THAT INTEREST YOU</h2>
      ) : null}

      {error && <p role="alert">{error}</p>}
      {loading && <p className="center-note full" role="status">Loading clubs…</p>}
      {!loading && myApplication && <p>Leave your current club before joining another.</p>}
      {!loading && <div className="club-list">
        {clubs.map((club) => {
          const status = requests.find((request) => request.club_id === club.id)?.status?.toLowerCase();
          return (
            <Link to={`/clubs/${club.id}`} className="club-row" key={club.id}>
              <div>
                <strong>{club.name}</strong>
                <p>{club.description}</p>
              </div>
              {status && ["pending", "approved", "rejected"].includes(status) && <span>{status}</span>}
              <ArrowRight size={22} />
            </Link>
          );
        })}
      </div>}
    </>
  );
}
