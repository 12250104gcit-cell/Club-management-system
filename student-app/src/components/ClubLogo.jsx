import { useState } from "react";

// Shows the club logo and falls back to the club image if the logo is missing
export default function ClubLogo({ club, className = "" }) {
  const [src, setSrc] = useState(club.logo);

  return (
    <img
      src={src}
      alt={club.name}
      className={className}
      onError={() => src !== club.image && setSrc(club.image)}
    />
  );
}
