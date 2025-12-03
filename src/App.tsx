import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import EventDetail from "./pages/EventDetail";
import Groups from "./pages/Groups";
import GroupChat from "./pages/GroupChat";
import Profile from "./pages/Profile";
import VenuePanel from "./pages/VenuePanel";
import AttendanceView from "./pages/AttendanceView";
import AdminReports from "./pages/AdminReports";
import OrganizerEvents from "./pages/OrganizerEvents";
import OrganizerTeam from "./pages/OrganizerTeam";
import OrganizerSettings from "./pages/OrganizerSettings";
import CommunityLanding from "./pages/CommunityLanding";
import CommunityFeed from "./pages/CommunityFeed";
import OrganizerGroupsDashboard from "./pages/OrganizerGroupsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);

  useEffect(() => {
    // Show install prompt after 30 seconds if not dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setInstallPromptDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <OfflineBanner />
            {showInstallPrompt && !installPromptDismissed && (
              <InstallPrompt onDismiss={handleDismissInstall} />
            )}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/chat/:id" element={<GroupChat />} />
                <Route path="/chat" element={<Groups />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/venue" element={<VenuePanel />} />
                <Route path="/attendance/:groupId" element={<AttendanceView />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/organizer/events" element={<OrganizerEvents />} />
                <Route path="/organizer/team" element={<OrganizerTeam />} />
                <Route path="/organizer/settings" element={<OrganizerSettings />} />
                <Route path="/organizer/events/:id/groups" element={<OrganizerGroupsDashboard />} />
                <Route path="/c/:handle" element={<CommunityLanding />} />
                <Route path="/c/:handle/feed" element={<CommunityFeed />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
