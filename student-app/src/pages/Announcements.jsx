import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../data/api";

export default function Announcements() {
  const { membership } = useOutletContext();
  const approved = membership.status === "approved" ? membership.approved : null;
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (approved) api("/student/announcements").then(setList).catch(e => setError(e.message)); }, [approved?.club_id]);
  return <>
    <h2 className="page-title">Announcements</h2>
    {membership.status === "loading" ? <p className="center-note full">Checking club membership…</p> : membership.status === "error" ? <p className="center-note full" role="alert">{membership.error}</p> : approved ? <div className="card-stack">
      {error && <p role="alert">{error}</p>}
      {list.map(item => <article className="info-card" key={item.id}><h3>{item.title}</h3><span className="announcement-category">{item.category || "General"}</span><p>{item.body || item.message}</p><span className="posted-by">Published {new Date(item.created_at).toLocaleString()}</span></article>)}
      {!error && list.length===0 && <p>No announcements yet.</p>}
    </div> : <p className="center-note full">Your club request must be approved to access announcements.</p>}
  </>;
}
