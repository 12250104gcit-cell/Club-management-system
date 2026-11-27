
import { useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  CircleCheck,
} from "lucide-react";

const toLocalDateTimeValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};


function PollManagement({
  onCreate,
  onView,
  onUpdate,
  onDelete,
  polls = [],
  loading = false,
  error = "",
  onRetry,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);

  // Poll being edited
  const [editingPoll, setEditingPoll] = useState(null);

  // Poll awaiting deletion confirmation
  const [deletingPoll, setDeletingPoll] = useState(null);

  // Editable form fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editOptions, setEditOptions] = useState([]);
  const [actionError, setActionError] = useState("");
  const [showFutureDateWarning, setShowFutureDateWarning] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingPollChanges, setPendingPollChanges] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const filteredPolls = polls.filter((poll) => {
    const matchesSearch = poll.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || poll.status === filter;

    return matchesSearch && matchesFilter;
  });

  // Open edit popup
  const handleEdit = (poll) => {
    setEditingPoll(poll);
    setEditTitle(poll.title);
    setEditDescription(poll.description || "");
    setEditEndDate(toLocalDateTimeValue(poll.endDate));
    setEditOptions(
      (poll.options || []).map((option) => ({ ...option }))
    );
    setOpenMenu(null);
  };

  // Update an option
  const updateEditOption = (index, value) => {
    setEditOptions((previous) =>
      previous.map((option, i) =>
        i === index ? { ...option, text: value } : option
      )
    );
  };

  // Add another option
  const addEditOption = () => {
    setEditOptions((previous) => [
      ...previous,
      {
        id: Date.now(),
        text: "",
        votes: 0,
      },
    ]);
  };

  // Remove an option
  const removeEditOption = (index) => {
    if (editOptions.length <= 2) return;

    const option = editOptions[index];

    if ((option.votes || 0) > 0) {
      alert("You cannot remove an option that has received votes.");
      return;
    }

    setEditOptions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // Save edited poll
  const handleSaveEdit = async (event) => {
    event.preventDefault();

    const title = editTitle.trim();

    if (!title) {
      alert("Please enter a poll title.");
      return;
    }

    const cleanOptions = editOptions.map((option) => ({
      ...option,
      text: option.text.trim(),
    }));

    if (
      cleanOptions.length > 0 &&
      (cleanOptions.length < 2 ||
        cleanOptions.some((option) => !option.text))
    ) {
      alert("Please provide at least two valid poll options.");
      return;
    }

    const optionNames = cleanOptions.map((option) =>
      option.text.toLowerCase()
    );

    if (new Set(optionNames).size !== optionNames.length) {
      alert("Poll options must be different.");
      return;
    }

    // Existing sample polls may not have an end date.
    // Validate only when a date is supplied or changed.
    if (editEndDate) {
      const chosenDate = new Date(editEndDate);
      const originalDate = editingPoll.endDate ? new Date(editingPoll.endDate) : null;
      const dateChanged = !originalDate || Number.isNaN(originalDate.getTime()) || chosenDate.getTime() !== originalDate.getTime();
      if (Number.isNaN(chosenDate.getTime()) || (dateChanged && chosenDate <= new Date())) {
        setShowFutureDateWarning(true);
        return;
      }
    }

    setActionError("");
    setPendingPollChanges({ ...editingPoll, title, description: editDescription.trim(), endDate: editEndDate, options: cleanOptions });
    setShowSaveConfirmation(true);
  };

  const handleConfirmSaveEdit = async () => {
    if (!pendingPollChanges) return;
    setSavingEdit(true);
    setActionError("");
    try {
      await onUpdate(pendingPollChanges);
      setEditingPoll(null);
      setShowSaveConfirmation(false);
      setPendingPollChanges(null);
    } catch (e) {
      setShowSaveConfirmation(false);
      setPendingPollChanges(null);
      setActionError(e.message);
    } finally { setSavingEdit(false); }
  };

  // Delete after confirmation
  const handleConfirmDelete = async () => {
    if (!deletingPoll) return;
    setActionError("");
    try { await onDelete(deletingPoll.id); setDeletingPoll(null); }
    catch (e) { setActionError(e.message); }
  };

  return (
    <main className="poll-page">
      <header className="poll-heading">
        <h2>Poll Management</h2>
      </header>

      <section className="poll-introduction">
        <h3>Create a New Poll</h3>
        <p>
          Start a new poll to get quick feedback from your
          club members.
        </p>

        <button
          type="button"
          className="create-poll-button"
          onClick={onCreate}
        >
          <Plus size={18} />
          Create Poll
        </button>
      </section>

      <div className="poll-search">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search polls..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="poll-filters">
        {["All", "Active", "Closed"].map((item) => (
          <button
            type="button"
            key={item}
            className={
              filter === item ? "poll-filter-active" : ""
            }
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="poll-list">
        {actionError && <p role="alert">{actionError}</p>}
        {error && <p role="alert">{error} <button type="button" onClick={onRetry}>Retry</button></p>}
        {loading && <p role="status">Loading polls…</p>}
        {filteredPolls.map((poll) => (
          <article className="poll-card" key={poll.id}>
            <div className="poll-card-top">
              <span className="poll-status">
                {poll.status}
              </span>

              <div className="poll-menu-wrapper">
                <button
                  type="button"
                  className="poll-menu-button"
                  aria-label={`Options for ${poll.title}`}
                  aria-expanded={openMenu === poll.id}
                  onClick={() =>
                    setOpenMenu(
                      openMenu === poll.id ? null : poll.id
                    )
                  }
                >
                  <MoreVertical size={19} />
                </button>

                {openMenu === poll.id && (
                  <div className="poll-dropdown">
                    <button
                      type="button"
                      onClick={() => handleEdit(poll)}
                    >
                      <Pencil size={15} />
                      Edit Poll
                    </button>

                    <button
                      type="button"
                      className="poll-delete-menu"
                      onClick={() => {
                        setDeletingPoll(poll);
                        setOpenMenu(null);
                      }}
                    >
                      <Trash2 size={15} />
                      Delete Poll
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3>
              <button
                type="button"
                className="poll-title-button"
                onClick={() => onView(poll)}
              >
                {poll.title}
              </button>
            </h3>

            <p>{poll.description}</p>
          </article>
        ))}

        {!loading && !error && filteredPolls.length === 0 && (
          <p>No polls found.</p>
        )}
      </section>

      {/* Edit Poll Popup */}
      {editingPoll && (
        <div className="poll-modal-overlay">
          <div
            className="poll-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-poll-heading"
          >
            <div className="poll-modal-heading">
              <h2 id="edit-poll-heading">Edit Poll</h2>

              <button
                type="button"
                aria-label="Close edit form"
                onClick={() => setEditingPoll(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <label htmlFor="edit-poll-title">
                Poll Title
              </label>
              <input
                id="edit-poll-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />

              <label htmlFor="edit-poll-description">
                Description
              </label>
              <textarea
                id="edit-poll-description"
                rows={3}
                value={editDescription}
                onChange={(e) =>
                  setEditDescription(e.target.value)
                }
              />

              <label htmlFor="edit-poll-end-date">
                End Date
              </label>
              <input
                id="edit-poll-end-date"
                type="datetime-local"
                value={editEndDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditEndDate(value);
                  if (value && (!Number.isFinite(new Date(value).getTime()) || new Date(value) <= new Date())) setShowFutureDateWarning(true);
                }}
              />

              <label>Poll Options</label>

              {editOptions.length === 0 && (
                <p className="poll-edit-note">
                  This sample poll has no voting options yet.
                </p>
              )}

              {editOptions.map((option, index) => (
                <div className="poll-edit-option-row" key={option.id}>
                  <input
                    type="text"
                    value={option.text}
                    placeholder={`Option ${index + 1}`}
                    onChange={(e) =>
                      updateEditOption(index, e.target.value)
                    }
                    required
                  />

                  {editOptions.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remove option ${index + 1}`}
                      onClick={() => removeEditOption(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="poll-add-edit-option"
                onClick={addEditOption}
              >
                <Plus size={16} />
                Add Option
              </button>

              <div className="poll-edit-actions">
                <button
                  type="button"
                  className="poll-edit-cancel"
                  onClick={() => setEditingPoll(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="poll-edit-save"
                >
                  Save Changes
                </button>
              </div>
              {actionError && <p className="poll-edit-error" role="alert">{actionError}</p>}
            </form>
          </div>
        </div>
      )}

      {showFutureDateWarning && (
        <div className="poll-modal-overlay">
          <div className="poll-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="future-poll-date-heading" aria-describedby="future-poll-date-description">
            <div className="poll-delete-icon poll-date-warning-icon"><CalendarDays size={26} /></div>
            <h2 id="future-poll-date-heading">Please choose a future date</h2>
            <p id="future-poll-date-description">A poll’s end date and time must be later than now.</p>
            <div className="poll-delete-actions">
              <button type="button" className="poll-delete-confirm poll-date-warning-confirm" onClick={() => { setShowFutureDateWarning(false); window.setTimeout(() => document.getElementById("edit-poll-end-date")?.focus(), 0); }}>Choose another date</button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirmation && pendingPollChanges && (
        <div className="poll-modal-overlay">
          <div className="poll-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="save-poll-changes-heading" aria-describedby="save-poll-changes-description">
            <div className="poll-delete-icon decision-dialog-icon approve"><CircleCheck size={26} /></div>
            <h2 id="save-poll-changes-heading">Save poll changes?</h2>
            <p id="save-poll-changes-description">Save the updates to <strong>{pendingPollChanges.title}</strong>?</p>
            <div className="poll-delete-actions">
              <button type="button" className="poll-edit-cancel" disabled={savingEdit} onClick={() => { setShowSaveConfirmation(false); setPendingPollChanges(null); }}>Cancel</button>
              <button type="button" className="poll-delete-confirm decision-confirm-approved" disabled={savingEdit} onClick={handleConfirmSaveEdit}>{savingEdit ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deletingPoll && (
        <div className="poll-modal-overlay">
          <div
            className="poll-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-poll-heading"
          >
            <div className="poll-delete-icon">
              <Trash2 size={26} />
            </div>

            <h2 id="delete-poll-heading">
              Delete Poll?
            </h2>

            <p>
              Are you sure you want to delete
              <strong> {deletingPoll.title}</strong>?
            </p>

            <p>
              This action cannot be undone.
            </p>

            <div className="poll-delete-actions">
              <button
                type="button"
                className="poll-edit-cancel"
                onClick={() => setDeletingPoll(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="poll-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Delete Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default PollManagement;
