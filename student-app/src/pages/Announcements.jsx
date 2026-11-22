import { useOutletContext } from "react-router-dom";
import { announcements } from "../data/appData";

export default function Announcements() {
  const { membership } = useOutletContext();
  const approved = membership.status === "approved" ? membership.approved : null;
  const list = approved
    ? announcements.filter((a) => a.clubId === approved.club_id)
    : [];

  return (
    <>
      <h2 className="page-title">Announcements</h2>

      {membership.status === "loading" ? <p className="center-note full">Checking club membership…</p> : membership.status === "error" ? <p className="center-note full" role="alert">{membership.error}</p> : approved ? (
        <div className="card-stack">
          {list.map((item) => (
            <article className="info-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.message}</p>
              <span className="posted-by">
                Posted by {item.postedBy} · {item.date}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="center-note full">Your club request must be approved to access announcements.</p>
      )}
    </>
  );
}
