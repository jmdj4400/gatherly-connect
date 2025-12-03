import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/chat/:id" element={<GroupChat />} />
            <Route path="/chat" element={<Groups />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/venue" element={<VenuePanel />} />
            <Route path="/attendance/:groupId" element={<AttendanceView />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
