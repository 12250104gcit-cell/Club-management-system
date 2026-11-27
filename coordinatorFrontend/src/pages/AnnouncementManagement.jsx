
import { useState } from "react";
import {
  Megaphone,
  Users,
  Plus,
  Search,
  CalendarDays,
  MoreVertical,
  Trash2,
} from "lucide-react";



function AnnouncementManagement({
  onCreate,
  onView,
  onEdit,
  onDelete,
  announcements = [],
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await onDelete?.(deleteTarget);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error.message || "Could not delete the announcement.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = announcement.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      announcement.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handleViewAnnouncement = (announcement) => {
    setOpenMenu(null);

    if (onView) {
      onView(announcement);
    }
  };

  return (
    <main className="announcement-page">
      <header className="announcement-header">
        <h2>Announcement Management</h2>
      </header>

      <button
        type="button"
        className="create-announcement-button"
        onClick={onCreate}
      >
        <Plus size={16} />
        Create Announcement
      </button>

      <div className="announcement-search">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search Announcement"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="announcement-filters">
        {["All", "Published"].map((item) => (
          <button
            type="button"
            key={item}
            className={
              filter === item ? "announcement-filter-active" : ""
            }
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="announcement-list">
        {filteredAnnouncements.map((announcement) => (
          <article
            className="announcement-card"
            key={announcement.id}
          >
            <div className="announcement-icon">
              {announcement.type === "club" ? (
                <Users size={20} />
              ) : (
                <Megaphone size={20} />
              )}
            </div>

            <div className="announcement-card-content">
              <div className="announcement-card-heading">

                {/* Click title to open Announcement Details */}
                <h3>
                  <button
                    type="button"
                    className="announcement-title-button"
                    onClick={() =>
                      handleViewAnnouncement(announcement)
                    }
                  >
                    {announcement.title}
                  </button>
                </h3>

                <div className="announcement-card-controls">
                  <span
                    className={`announcement-status ${
                      announcement.status === "Published"
                        ? "status-published"
                        : "status-pending"
                    }`}
                  >
                    {announcement.status}
                  </span>

                  <div className="announcement-menu-wrapper">
                    <button
                      type="button"
                      className="announcement-menu-button"
                      aria-label={`Options for ${announcement.title}`}
                      aria-expanded={openMenu === announcement.id}
                      onClick={() =>
                        setOpenMenu(
                          openMenu === announcement.id
                            ? null
                            : announcement.id
                        )
                      }
                    >
                      <MoreVertical size={17} />
                    </button>

                    {openMenu === announcement.id && (
                      <div className="announcement-dropdown">
                        <button
                          type="button"
                          className="announcement-dropdown-action"
                          onClick={() =>
                            handleViewAnnouncement(announcement)
                          }
                        >
                          View Details
                        </button>
                        <button type="button" className="announcement-dropdown-action" onClick={() => { setOpenMenu(null); onEdit?.(announcement); }}>Edit</button>
                        <button type="button" className="announcement-dropdown-action" onClick={() => { setDeleteError(""); setDeleteTarget(announcement); setOpenMenu(null); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p>{announcement.description}</p>

              <div className="announcement-card-footer">
                <span>
                  <CalendarDays size={12} />
                  {announcement.date}
                </span>

              </div>
            </div>
          </article>
        ))}

        {filteredAnnouncements.length === 0 && (
          <p className="announcement-empty">
            No announcements found.
          </p>
        )}
      </section>
      {deleteTarget && <div className="poll-modal-overlay"><div className="poll-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-announcement-heading" aria-describedby="delete-announcement-description">
        <div className="poll-delete-icon"><Trash2 size={26} /></div>
        <h2 id="delete-announcement-heading">Delete announcement?</h2>
        <p id="delete-announcement-description">Are you sure you want to delete <strong>{deleteTarget.title}</strong>?</p>
        <p>This action cannot be undone.</p>
        {deleteError && <p role="alert">{deleteError}</p>}
        <div className="poll-delete-actions">
          <button type="button" className="poll-edit-cancel" disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="poll-delete-confirm" disabled={deleteBusy} onClick={confirmDelete}>{deleteBusy ? "Deleting…" : "Delete announcement"}</button>
        </div>
      </div></div>}
    </main>
  );
}

export default AnnouncementManagement;
