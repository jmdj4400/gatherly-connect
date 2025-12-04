import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { CookieConsent } from "@/components/cookie/CookieConsent";
import { DeepLinkHandler } from "@/components/native/DeepLinkHandler";
import { PageLoader } from "@/components/ui/loading-spinner";

// Eagerly load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load other pages for code-splitting
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Explore = lazy(() => import("./pages/Explore"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const Profile = lazy(() => import("./pages/Profile"));
const VenuePanel = lazy(() => import("./pages/VenuePanel"));
const AttendanceView = lazy(() => import("./pages/AttendanceView"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const OrganizerEvents = lazy(() => import("./pages/OrganizerEvents"));
const OrganizerTeam = lazy(() => import("./pages/OrganizerTeam"));
const OrganizerSettings = lazy(() => import("./pages/OrganizerSettings"));
const CommunityLanding = lazy(() => import("./pages/CommunityLanding"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const OrganizerGroupsDashboard = lazy(() => import("./pages/OrganizerGroupsDashboard"));
const OrganizerWidgets = lazy(() => import("./pages/OrganizerWidgets"));
const Premium = lazy(() => import("./pages/Premium"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));

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
              <DeepLinkHandler />
              <CookieConsent />
              <Suspense fallback={<PageLoader message="Loading..." />}>
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
                  <Route path="/organizer/widgets" element={<OrganizerWidgets />} />
                  <Route path="/c/:handle" element={<CommunityLanding />} />
                  <Route path="/c/:handle/feed" element={<CommunityFeed />} />
                  <Route path="/premium" element={<Premium />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
