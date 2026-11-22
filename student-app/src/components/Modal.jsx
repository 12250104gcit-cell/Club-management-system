import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

// variant: "warning" (yellow), "success" (green), "danger" (red diamond)
export default function Modal({ variant = "warning", title, lines = [], children }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        {variant === "danger" ? (
          <TriangleAlert className="modal-danger-icon" size={64} strokeWidth={1.6} />
        ) : (
          <div className={`modal-icon modal-icon-${variant}`}>
            {variant === "success" ? (
              <CircleCheck size={34} strokeWidth={1.6} />
            ) : (
              <CircleAlert size={34} strokeWidth={1.6} />
            )}
          </div>
        )}

        <h2>{title}</h2>

        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}

        <div className="modal-actions">{children}</div>
      </div>
    </div>
  );
}
