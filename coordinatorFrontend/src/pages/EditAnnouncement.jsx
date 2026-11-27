import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = ["Event", "Club", "Urgent", "General"];

export default function EditAnnouncement({ announcement, onCancel, onSave }) {
  const [title, setTitle] = useState(announcement?.title || "");
  const [category, setCategory] = useState(announcement?.category || "General");
  const [description, setDescription] = useState(announcement?.description || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Enter an announcement title and details before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(announcement, title.trim(), category, description.trim());
    } catch (saveError) {
      setError(saveError.message || "Could not save the announcement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="create-page">
      <header className="create-page-header">
        <button type="button" onClick={onCancel} aria-label="Go back"><ArrowLeft size={20} /></button>
        <h2>Edit Announcement</h2>
      </header>

      <form className="create-form" onSubmit={handleSubmit}>
        <label htmlFor="edit-announcement-title">Announcement Title</label>
        <input id="edit-announcement-title" type="text" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} required />

        <label>Category</label>
        <div className="category-options" role="group" aria-label="Announcement category">
          {[...new Set([...CATEGORIES, category])].map((item) => (
            <button type="button" key={item} className={category === item ? "selected-category" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>

        <label htmlFor="edit-announcement-details">Announcement Details</label>
        <textarea id="edit-announcement-details" rows={6} maxLength={10000} value={description} onChange={(event) => setDescription(event.target.value)} required />
        {error && <p role="alert">{error}</p>}

        <div className="create-form-actions">
          <button type="button" className="cancel-create" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="confirm-create" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </form>
    </main>
  );
}
