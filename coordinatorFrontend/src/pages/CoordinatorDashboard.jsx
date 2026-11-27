
import {
  Users,
  Megaphone,
  BarChart3,
  ArrowRight,
} from "lucide-react";



function CoordinatorDashboard({ onNavigate }) {
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

    </main>
  );
}

export default CoordinatorDashboard;
