
import { ArrowLeft, CalendarDays, FileText, Link } from "lucide-react";

function AnnouncementDetails({ announcement, onBack }) {
  if (!announcement) {
    return (
      <main className="details-page">
        <p>Announcement not found.</p>
        <button onClick={onBack}>Back</button>
      </main>
    );
  }

  return (
    <main className="details-page">
      <header className="details-header">
        <button type="button" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2>Announcement Details</h2>
      </header>

      <article className="details-card">
        <h3>{announcement.title}</h3>

        <div className="details-meta">
          <span><CalendarDays size={14} /> {announcement.date}</span>
        </div>

        {announcement.image && (
          <img
            className="details-cover"
            src={URL.createObjectURL(announcement.image)}
            alt="Announcement cover"
          />
        )}

        <p className="details-description">
          {announcement.description}
        </p>

        {announcement.schedule && (
          <p className="details-schedule">
            Scheduled: {new Date(announcement.schedule).toLocaleString()}
          </p>
        )}

        <div className="details-attachments">
          <h4>Attachments</h4>
          <div className="details-attachment">
            <FileText size={18} />
            <span>No PDF attached</span>
          </div>
          <div className="details-attachment">
            <Link size={18} />
            <span>No external link added</span>
          </div>
        </div>
      </article>
    </main>
  );
}

export default AnnouncementDetails;
