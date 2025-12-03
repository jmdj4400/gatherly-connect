import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Sparkles, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EventCard } from '@/components/events/EventCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/page-transition';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { LandingPage } from '@/components/landing/LandingPage';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  city: string | null;
  venue_name: string | null;
  starts_at: string;
  allow_come_alone: boolean;
}


export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [profile]);

  const fetchUpcomingEvents = async () => {
    let query = supabase
      .from('events')
      .select('*')
      .eq('allow_come_alone', true)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(6);

    if (profile?.city) {
      query = query.eq('city', profile.city);
    }

    const { data } = await query;
    if (data) {
      setUpcomingEvents(data);
    }
    setLoadingEvents(false);
  };

  // Show landing page for non-authenticated users
  if (!loading && !user) {
    return <LandingPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading your feed...</p>
        </div>
      </div>
    );
  }

  // Authenticated home feed
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <FadeIn>
              <h1 className="text-2xl font-bold tracking-tight">
                Hey, {profile?.display_name?.split(' ')[0] || 'there'} 👋
              </h1>
              {profile?.city && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.city}</span>
                </div>
              )}
            </FadeIn>
            <FadeIn delay={0.1}>
              <Link to="/profile">
                <Avatar ring size="lg">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </FadeIn>
          </div>
        </div>
      </header>

      {/* Onboarding reminder */}
      {profile && !profile.onboarding_completed && (
        <FadeIn className="mx-4 mt-4">
          <Card variant="elevated" className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">Complete your profile</h3>
                <p className="text-sm text-muted-foreground">
                  Help us match you with the right people
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/onboarding')}>
                Continue
              </Button>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Content */}
      <main className="px-4 py-6 space-y-8">
        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Events for You</h2>
              <p className="text-xs text-muted-foreground">Based on your interests</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/explore" className="flex items-center gap-1">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loadingEvents ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events yet"
              description="Check back soon for events in your area"
              action={{
                label: "Browse All Events",
                onClick: () => navigate('/explore'),
              }}
            />
          ) : (
            <StaggerContainer className="grid gap-4">
              {upcomingEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <EventCard event={event} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
