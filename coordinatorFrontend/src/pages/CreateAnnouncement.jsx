
import { useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  CalendarDays,
} from "lucide-react";

function CreateAnnouncement({ onCancel, onCreate }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Event");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [image, setImage] = useState(null);

  // Control the confirmation popup
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  // Validate the form before confirmation
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter an announcement title.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter announcement details.");
      return;
    }

    if (
      schedule &&
      (Number.isNaN(new Date(schedule).getTime()) ||
        new Date(schedule) <= new Date())
    ) {
      alert("Please select a future date and time.");
      return;
    }

    // Open confirmation instead of publishing immediately
    setShowConfirmation(true);
  };

  // Publish only after confirming
  const handleConfirm = () => {
    const newAnnouncement = {
      id: Date.now(),
      title: title.trim(),
      category,
      description: description.trim(),
      schedule,
      image,
      status: schedule ? "Pending" : "Published",
    };

    setShowConfirmation(false);
    onCreate(newAnnouncement);
  };

  return (
    <main className="create-page">
      {/* Page Header */}
      <header className="create-page-header">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <h2>Create Announcement</h2>
      </header>

      {/* Announcement Form */}
      <form className="create-form" onSubmit={handleSubmit}>
        <label htmlFor="announcement-title">
          Announcement Title
        </label>

        <input
          id="announcement-title"
          type="text"
          placeholder="Enter announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Category</label>

        <div className="category-options">
          {["Event", "Club", "Urgent", "General"].map(
            (item) => (
              <button
                type="button"
                key={item}
                className={
                  category === item
                    ? "selected-category"
                    : ""
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            )
          )}
        </div>

        <label htmlFor="announcement-description">
          Announcement Details
        </label>

        <textarea
          id="announcement-description"
          placeholder="Write announcement details..."
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          rows={5}
          required
        />

        <label htmlFor="announcement-image">
          Add Image (Optional)
        </label>

        <label
          className="image-upload"
          htmlFor="announcement-image"
        >
          <ImagePlus size={24} />

          <span>
            {image ? image.name : "Add Cover Image"}
          </span>
        </label>

        <input
          id="announcement-image"
          type="file"
          accept="image/*"
          hidden
          onChange={(e) =>
            setImage(e.target.files?.[0] || null)
          }
        />

        <label htmlFor="announcement-schedule">
          Date & Time
        </label>

        <div className="schedule-input">
          <CalendarDays size={18} />

          <input
            id="announcement-schedule"
            type="datetime-local"
            value={schedule}
            onChange={(e) =>
              setSchedule(e.target.value)
            }
          />
        </div>

        {/* Action Buttons */}
        <div className="create-form-actions">
          <button
            type="button"
            className="cancel-create"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="confirm-create"
          >
            Publish
          </button>
        </div>
      </form>

      {/* Announcement Confirmation Popup */}
      {showConfirmation && (
        <div className="announcement-modal-overlay">
          <div
            className="announcement-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-confirm-title"
            aria-describedby="announcement-confirm-description"
          >
            <h2 id="announcement-confirm-title">
              Are You Sure?
            </h2>

            <p id="announcement-confirm-description">
              Are you sure you want to create this
              announcement? This action cannot be undone.
            </p>

            <button
              type="button"
              className="announcement-confirm-button"
              onClick={handleConfirm}
            >
              Confirm
            </button>

            <button
              type="button"
              className="announcement-go-back-button"
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

export default CreateAnnouncement;
