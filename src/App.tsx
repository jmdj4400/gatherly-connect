import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { CookieConsent } from "@/components/cookie/CookieConsent";
import { DeepLinkHandler } from "@/components/native/DeepLinkHandler";
import { NativeErrorBoundary } from "@/components/native/NativeErrorBoundary";
import { PageLoader } from "@/components/ui/loading-spinner";
import { isNative, initializeCapacitor } from "@/lib/capacitor";
import { useNativeBackButton } from "@/hooks/useNativeBackButton";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";

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
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const Press = lazy(() => import("./pages/Press"));
const Contact = lazy(() => import("./pages/Contact"));
const Partners = lazy(() => import("./pages/Partners"));
const Stories = lazy(() => import("./pages/Stories"));

const queryClient = new QueryClient();

// Initialize Capacitor on app start
initializeCapacitor();

// Native hooks wrapper component (must be inside BrowserRouter)
function NativeHooks() {
  useNativeBackButton();
  useAppLifecycle();
  return null;
}

const App = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);
  const native = isNative();

  useEffect(() => {
    // Don't show install prompt on native apps
    if (native) return;
    
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
  }, [native]);

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
        <NativeErrorBoundary>
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <OfflineBanner />
              {!native && showInstallPrompt && !installPromptDismissed && (
                <InstallPrompt onDismiss={handleDismissInstall} />
              )}
              <BrowserRouter>
                <NativeHooks />
                <DeepLinkHandler />
                {!native && <CookieConsent />}
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
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/press" element={<Press />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/partners" element={<Partners />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
        </NativeErrorBoundary>
        </I18nProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
