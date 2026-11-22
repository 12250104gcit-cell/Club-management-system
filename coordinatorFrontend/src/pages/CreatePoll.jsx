
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CircleAlert,
} from "lucide-react";

function CreatePoll({ onCancel, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Update a poll option
  const updateOption = (index, value) => {
    setOptions((previous) =>
      previous.map((option, i) =>
        i === index ? value : option
      )
    );
  };

  // Add another poll option
  const addOption = () => {
    setOptions((previous) => [...previous, ""]);
  };

  // Remove an option
  const removeOption = (index) => {
    if (options.length <= 2) return;

    setOptions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // Validate form and open confirmation popup
  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanOptions = options.map((option) =>
      option.trim()
    );

    if (!title.trim()) {
      alert("Please enter a poll title.");
      return;
    }

    if (cleanOptions.some((option) => !option)) {
      alert("Please fill in all poll options.");
      return;
    }

    if (
      new Set(
        cleanOptions.map((option) => option.toLowerCase())
      ).size !== cleanOptions.length
    ) {
      alert("Poll options must be different.");
      return;
    }

    if (
      !endDate ||
      Number.isNaN(new Date(endDate).getTime()) ||
      new Date(endDate) <= new Date()
    ) {
      alert("Please select a future end date.");
      return;
    }

    setShowConfirmation(true);
  };

  // Create poll after confirmation
  const handleConfirm = async () => {
    const newPoll = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      endDate,
      options: options.map((text, index) => ({
        id: index + 1,
        text: text.trim(),
        votes: 0,
      })),
      status: "Active",
    };

    setSaving(true); setError("");
    try { await onCreate(newPoll); setShowConfirmation(false); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <main className="create-poll-page">
      {/* Page Header */}
      <header className="create-poll-header">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <h2>Create Poll</h2>
      </header>

      {/* Create Poll Form */}
      <form
        className="create-poll-form"
        onSubmit={handleSubmit}
      >
        {error && <p role="alert">{error}</p>}
        <label htmlFor="poll-title">
          Poll Title
        </label>

        <input
          id="poll-title"
          type="text"
          placeholder="e.g. Club Activity for this Semester"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          required
        />

        <label htmlFor="poll-description">
          Description
        </label>

        <textarea
          id="poll-description"
          placeholder="Add description (optional)"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          rows={3}
        />

        <label htmlFor="poll-end-date">
          End Date
        </label>

        <input
          id="poll-end-date"
          type="datetime-local"
          value={endDate}
          onChange={(event) =>
            setEndDate(event.target.value)
          }
          required
        />

        <label>Poll Options</label>

        {options.map((option, index) => (
          <div
            className="poll-option-row"
            key={index}
          >
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(event) =>
                updateOption(
                  index,
                  event.target.value
                )
              }
              required
            />

            {options.length > 2 && (
              <button
                type="button"
                onClick={() =>
                  removeOption(index)
                }
                aria-label={`Remove option ${index + 1}`}
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
        ))}

        {/* Add Option */}
        <button
          type="button"
          className="add-poll-option"
          onClick={addOption}
        >
          <Plus size={17} />
          Add Option
        </button>

        {/* Form Actions */}
        <div className="poll-form-actions">
          <button
            type="button"
            className="poll-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="poll-submit-button"
            disabled={saving}
          >
            Create Poll
          </button>
        </div>
      </form>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="poll-modal-overlay">
          <div
            className="poll-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="poll-confirm-title"
            aria-describedby="poll-confirm-description"
          >
            <div className="poll-warning-icon">
              <CircleAlert
                size={28}
                strokeWidth={1.8}
              />
            </div>

            <h2 id="poll-confirm-title">
              Are You Sure?
            </h2>

            <p id="poll-confirm-description">
              Are you sure you want to create this poll?
              This action will create a new poll.
            </p>

            <button
              type="button"
              className="poll-confirm-button"
              disabled={saving}
              onClick={handleConfirm}
            >
              {saving ? "Saving…" : "Confirm"}
            </button>

            <button
              type="button"
              className="poll-go-back-button"
              onClick={() =>
                setShowConfirmation(false)
              }
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default CreatePoll;
