
import {
  House,
  ListFilter,
  Megaphone,
  ListTodo,
  CircleUserRound,
} from "lucide-react";

import "./BottomNavigation.css";

const navigationItems = [
  { id: "home", label: "Home", icon: House },
  { id: "clubs", label: "Clubs", icon: ListFilter },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "poll", label: "Poll", icon: ListTodo },
  { id: "profile", label: "Profile", icon: CircleUserRound },
];

function BottomNavigation({ activePage = "clubs", onNavigate }) {
  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            className={`navigation-item ${
              activePage === item.id ? "navigation-active" : ""
            }`}
            onClick={() => onNavigate?.(item.id)}
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;
