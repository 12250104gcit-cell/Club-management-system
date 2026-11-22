import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import Announcements from "./pages/Announcements";
import Polls from "./pages/Polls";
import Profile from "./pages/Profile";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Auth />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetails />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/me" element={<MyProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
