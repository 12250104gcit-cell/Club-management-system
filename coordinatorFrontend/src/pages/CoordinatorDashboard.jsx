
import { useEffect, useState } from "react";
import {
  Users,
  Megaphone,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { api } from "../api";



function CoordinatorDashboard({ onNavigate }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  useEffect(() => { api("/coordinator/requests").then(rows => setPendingRequests(rows.filter(row => row.status === "Pending"))).catch(() => setPendingRequests([])); }, []);
  return (
    <main className="dashboard-page">

      {/* Dashboard Banner */}
      <section className="dashboard-banner">
        <div className="dashboard-banner-content">
          <h2>Coordinator Dashboard</h2>
          <p>
            Manage clubs, track activities and engage
            with your student community.
          </p>

          <div className="dashboard-banner-line"></div>
        </div>

        {/* Illustration exported from Figma */}
        <img
          src="/images/dashboard-banner.png"
          alt="Student managing club activities"
          className="dashboard-banner-image"
        />
      </section>

      {/* Quick Access */}
      <h3 className="dashboard-section-title">
        Quick Access
      </h3>

      <section className="dashboard-quick-access">
        <button
          type="button"
          onClick={() => onNavigate("clubs")}
        >
          <Users size={20} />
          <span>
            <strong>Manage Clubs</strong>
            <small>
              View and manage all club activities,
              members and requests
            </small>
          </span>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("announcements")}
        >
          <Megaphone size={20} />
          <span>
            <strong>Create Announcement</strong>
            <small>
              Share updates and important information
              with clubs
            </small>
          </span>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("poll")}
        >
          <BarChart3 size={20} />
          <span>
            <strong>View Polls</strong>
            <small>
              Create and manage polls for student feedback
            </small>
          </span>
          <ArrowRight size={18} />
        </button>
      </section>

      {/* Recent Activity */}
      <h3 className="dashboard-section-title">
        Recent Activity
      </h3>

      <section className="dashboard-activities">

        {pendingRequests.length ? pendingRequests.slice(0, 3).map(request => <article className="activity-card" key={request.id}>
          <div className="activity-icon">
            <Users size={21} />
          </div>

          <div className="activity-information">
            <strong>Join request</strong>
            <p>{request.name} requested to join your club</p>
            <small>{request.email}</small>
          </div>

          <div className="activity-meta">
            <span className="activity-status activity-pending">
              Pending
            </span>
          </div>
        </article>) : <article className="activity-card"><div className="activity-icon"><Users size={21} /></div><div className="activity-information"><strong>No pending requests</strong><p>New requests for your club will appear here.</p></div></article>}

        {/* StartUP Club */}
        <article className="activity-card">
          <div className="activity-icon">
            <Megaphone size={21} />
          </div>

          <div className="activity-information">
            <strong>StartUP Club</strong>
            <p>Workshop on AI Tools</p>
            <small>By Ong · 20 members</small>
          </div>

          <div className="activity-meta">
            <span className="activity-time">5h ago</span>
            <span className="activity-status activity-published">
              Published
            </span>
          </div>
        </article>

      </section>
    </main>
  );
}

export default CoordinatorDashboard;
