import { useState } from "react";
import { STUDENT } from "../data/appData";

// Put the student's photo at /public/profile.jpg. Falls back to initials.
export default function Avatar({ size = 94 }) {
  const [failed, setFailed] = useState(false);
  const initials = STUDENT.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size / 3 }}>
      {failed ? (
        initials
      ) : (
        <img src="/profile.jpg" alt={STUDENT.name} onError={() => setFailed(true)} />
      )}
    </div>
  );
}
