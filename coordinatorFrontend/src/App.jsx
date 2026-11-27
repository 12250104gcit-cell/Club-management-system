
import { useState } from "react";
import { LogOut } from "lucide-react";

import Login from "./pages/Login";
import EnrollmentRequests from "./pages/EnrollmentRequests";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import BottomNavigation from "./components/BottomNavigation";
import AnnouncementManagement from "./pages/AnnouncementManagement";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import EditAnnouncement from "./pages/EditAnnouncement";
import AnnouncementDetails from "./pages/AnnouncementDetails";
import Header from "./components/Header";
import PollManagement from "./pages/PollManagement";
import CreatePoll from "./pages/CreatePoll";
import PollDetails from "./pages/PollDetails";
import CoordinatorProfile from "./pages/CoordinatorProfile";
import { api, portalUrl, redirectForRole } from "./api";
import { useEffect } from "react";

// Combined CSS for all pages
import "./pages/styles.css";

function App() {
  const [currentPage, setCurrentPage] = useState("checking");
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  useEffect(() => { api("/auth/me").then(user => { if(user.role === "coordinator") { setCurrentUser(user); setCurrentPage("home"); } else redirectForRole(user.role); }).catch(() => window.location.replace(portalUrl("student"))); }, []);

  // Store selected announcement and poll
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const loadAnnouncements = async () => { try { const data = await api("/coordinator/announcements"); setAnnouncements(data.map(a => ({...a, description:a.body || a.description, date:new Date(a.created_at).toLocaleString(), status:"Published", type:"announcement"}))); } catch(e) { setPollError(e.message); } };
  useEffect(() => { if (currentPage === "announcements") loadAnnouncements(); }, [currentPage]);

  // Sample polls
  const [polls, setPolls] = useState([]);
  const [pollError, setPollError] = useState("");
  const [pollLoading, setPollLoading] = useState(false);
  const loadPolls = async () => {
    setPollLoading(true); setPollError("");
    try { setPolls(await api("/coordinator/polls")); }
    catch (error) { setPollError(error.message); }
    finally { setPollLoading(false); }
  };
  useEffect(() => { if (currentPage === "poll") loadPolls(); }, [currentPage]);

  // Navigate between pages
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Create announcement
  const handleCreateAnnouncement = async (announcement) => {
    await api("/coordinator/announcements", {method:"POST", body:JSON.stringify({title:announcement.title, category:announcement.category, body:announcement.description})});
    await loadAnnouncements();
    setCurrentPage("announcements");
  };
  const handleUpdateAnnouncement = async (announcement, title, category, body) => {
    await api(`/coordinator/announcements/${announcement.id}`, {method:"PUT", body:JSON.stringify({title,category,body})});
    await loadAnnouncements();
    setSelectedAnnouncement(null);
    setCurrentPage("announcements");
  };
  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setCurrentPage("edit-announcement");
  };
  const handleDeleteAnnouncement = async (announcement) => {
    await api(`/coordinator/announcements/${announcement.id}`, {method:"DELETE"});
    await loadAnnouncements();
  };

  // View announcement details
  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setCurrentPage("announcement-details");
  };

  // Return to announcements
  const handleBackToAnnouncements = () => {
    setSelectedAnnouncement(null);
    setCurrentPage("announcements");
  };

  // Create a new poll
  const handleCreatePoll = async (poll) => {
    await api("/coordinator/polls", { method: "POST", body: JSON.stringify({ question: poll.title, description: poll.description, closes_at: new Date(poll.endDate).toISOString(), options: poll.options.map(option => option.text) }) });
    await loadPolls();
    setCurrentPage("poll");
  };

  // Update an existing poll
  const handleUpdatePoll = async (updatedPoll) => {
    await api(`/coordinator/polls/${updatedPoll.id}`, { method: "PUT", body: JSON.stringify({ question: updatedPoll.title, description: updatedPoll.description, closes_at: new Date(updatedPoll.endDate).toISOString(), options: updatedPoll.options.map(option => option.text) }) });
    await loadPolls();
  };

  const handleDeletePoll = async (pollId) => {
    await api(`/coordinator/polls/${pollId}`, { method: "DELETE" });
    await loadPolls();
    if (selectedPoll?.id === pollId) {
      setSelectedPoll(null);
      setCurrentPage("poll");
    }
  };

  // View poll details
  const handleViewPoll = (poll) => {
    setSelectedPoll(poll);
    setCurrentPage("poll-details");
  };

  // Return to Poll Management
  const handleBackToPolls = () => {
    setSelectedPoll(null);
    setCurrentPage("poll");
  };

  // Temporary frontend logout
  const handleLogout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    document.cookie = "club_token_share=; Path=/; SameSite=Lax; Max-Age=0";
    document.cookie = "club_user_share=; Path=/; SameSite=Lax; Max-Age=0";
    setSelectedAnnouncement(null);
    setSelectedPoll(null);
    setCurrentPage("login");
  };

  if (currentPage === "checking") return <div className="coordinator-app" role="status">Checking your session…</div>;

  // Login page - frontend demonstration
  if (currentPage === "login") {
    return (
      <Login onLogin={() => setCurrentPage("home")} />
    );
  }

  return (
    <div className="coordinator-app">

      {/* Shared Header */}
      <Header onLogout={() => setShowLogoutConfirm(true)} />

      {/* Coordinator Dashboard */}
      {currentPage === "home" && (
        <CoordinatorDashboard
          onNavigate={handleNavigate}
        />
      )}

      {/* Enrollment Requests */}
      {currentPage === "clubs" && (
        <EnrollmentRequests />
      )}

      {/* Announcement Management */}
      {currentPage === "announcements" && (
        <AnnouncementManagement
          announcements={announcements}
          onEdit={handleEditAnnouncement}
          onDelete={handleDeleteAnnouncement}
          onCreate={() =>
            setCurrentPage("create-announcement")
          }
          onView={handleViewAnnouncement}
        />
      )}

      {/* Create Announcement */}
      {currentPage === "create-announcement" && (
        <CreateAnnouncement
          onCancel={handleBackToAnnouncements}
          onCreate={handleCreateAnnouncement}
        />
      )}

      {currentPage === "edit-announcement" && (
        <EditAnnouncement
          announcement={selectedAnnouncement}
          onCancel={handleBackToAnnouncements}
          onSave={handleUpdateAnnouncement}
        />
      )}

      {/* Announcement Details */}
      {currentPage === "announcement-details" && (
        <AnnouncementDetails
          announcement={selectedAnnouncement}
          onBack={handleBackToAnnouncements}
        />
      )}

      {/* Poll Management */}
      {currentPage === "poll" && (
        <PollManagement
          polls={polls}
          loading={pollLoading}
          error={pollError}
          onRetry={loadPolls}
          onCreate={() => setCurrentPage("create-poll")}
          onView={handleViewPoll}
          onUpdate={handleUpdatePoll}
          onDelete={handleDeletePoll}
        />
      )}

      {/* Create Poll */}
      {currentPage === "create-poll" && (
        <CreatePoll
          onCancel={handleBackToPolls}
          onCreate={handleCreatePoll}
        />
      )}

      {/* Poll Details */}
      {currentPage === "poll-details" && (
        <PollDetails
          poll={selectedPoll}
          onBack={handleBackToPolls}
        />
      )}

      {/* Coordinator Profile and Settings */}
      {currentPage === "profile" && (
        <CoordinatorProfile currentUser={currentUser} onProfileUpdated={setCurrentUser} />
      )}

      {/* Shared Bottom Navigation */}
      <BottomNavigation
        activePage={
          ["create-poll", "poll-details"].includes(currentPage)
            ? "poll"
            : [
                "create-announcement",
                "announcement-details",
              ].includes(currentPage)
            ? "announcements"
            : currentPage
        }
        onNavigate={handleNavigate}
      />

      {showLogoutConfirm && <div className="poll-modal-overlay"><div className="poll-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="coordinator-logout-heading" aria-describedby="coordinator-logout-description">
        <div className="poll-delete-icon"><LogOut size={26} /></div>
        <h2 id="coordinator-logout-heading">Log out?</h2>
        <p id="coordinator-logout-description">Are you sure you want to log out of your coordinator account?</p>
        <div className="poll-delete-actions">
          <button type="button" className="poll-edit-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
          <button type="button" className="poll-delete-confirm" onClick={handleLogout}>Log out</button>
        </div>
      </div></div>}

    </div>
  );
}

export default App;
