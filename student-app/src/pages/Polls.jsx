import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CircleCheck, Undo2 } from "lucide-react";
import { api } from "../data/api";
import Modal from "../components/Modal";

export default function Polls() {
  const { membership } = useOutletContext();
  const approved = membership.status === "approved" ? membership.approved : null;
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const loadPolls = useCallback(async () => {
    setLoading(true); setError("");
    try { setPolls(await api("/student/polls")); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (approved) loadPolls(); }, [approved, loadPolls]);

  if (membership.status === "loading") return <><h2 className="page-title">Polls</h2><p className="center-note full">Checking club membership…</p></>;
  if (membership.status === "error") return <><h2 className="page-title">Polls</h2><p className="center-note full" role="alert">{membership.error}</p></>;
  if (!approved) return <><h2 className="page-title">Polls</h2><p className="center-note full">Your club request must be approved to access polls.</p></>;

  const castVote = async () => {
    const poll = polls.find(p => p.id === confirmId);
    if (!poll || !selected[confirmId]) return;
    try {
      await api(`/student/polls/${confirmId}/votes`, { method: "POST", body: JSON.stringify({ option_id: selected[confirmId] }) });
      setConfirmId(null); setSuccessOpen(true); await loadPolls();
    } catch (e) { setError(e.message); setConfirmId(null); await loadPolls(); }
  };
  return <>
    <h2 className="page-title">Polls</h2>
    {error && <p className="center-note full" role="alert">{error} <button type="button" onClick={loadPolls}>Retry</button></p>}
    {loading && polls.length === 0 && <p className="center-note full">Loading polls…</p>}
    <div className="card-stack">
      {polls.map(poll => {
        const hasVoted = poll.has_voted;
        const closed = !poll.is_open;
        const chosen = hasVoted ? poll.voted_option_id : selected[poll.id];
        const showResults = hasVoted || closed;
        const total = poll.total_votes || 0;
        return <article className="info-card poll-card" key={poll.id}>
          <h3>{poll.title}</h3><p>{poll.description || poll.question}</p>
          <span className="closing">{closed ? "Closed" : `Closes ${new Date(poll.closes_at).toLocaleString()}`}</span>
          <div className="poll-options">
            {poll.options.map(option => <label key={option.id} className={`poll-option${showResults ? " with-result" : ""}`}>
              <input type="radio" name={`poll-${poll.id}`} checked={Number(chosen) === option.id} disabled={hasVoted || closed}
                onChange={() => setSelected({ ...selected, [poll.id]: option.id })} />
              {showResults ? <>
                <span>{option.text}</span><span className="result-bar"><span style={{ width: `${option.percentage || 0}%` }} /></span>
                <span className="result-percent">{total ? Math.round(option.votes * 100 / total) : 0}%</span>
              </> : <span>{option.text}</span>}
            </label>)}
          </div>
          <div className="poll-footer">{hasVoted ? <span className="vote-btn voted" aria-label="Voted"><CircleCheck size={20} /></span>
            : closed ? <span className="closing">Closed</span> : <button type="button" className="vote-btn" disabled={!selected[poll.id]} onClick={() => setConfirmId(poll.id)}>VOTE</button>}</div>
        </article>;
      })}
      {!loading && !error && polls.length === 0 && <p className="center-note full">No polls available.</p>}
    </div>
    {confirmId && <Modal variant="warning" title="Are You Sure?" lines={["Are you sure you want to cast your vote?","This action cannot be undone"]}>
      <button type="button" className="btn-yellow" onClick={castVote}>Confirm</button>
      <button type="button" className="btn-outline" onClick={() => setConfirmId(null)}><Undo2 size={16} />Go Back</button>
    </Modal>}
    {successOpen && <Modal variant="success" title="Success" lines={["Your vote has been recorded","Please wait until voting period ends"]}>
      <button type="button" className="btn-green" onClick={() => setSuccessOpen(false)}>Confirm</button>
    </Modal>}
  </>;
}
