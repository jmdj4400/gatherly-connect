import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Sparkles, ArrowRight, MapPin, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EventCard } from '@/components/events/EventCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/page-transition';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-gathering.jpg';

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

const features = [
  {
    icon: Calendar,
    title: 'Find Events',
    description: 'Discover events happening near you that match your interests',
  },
  {
    icon: Users,
    title: 'Join Alone',
    description: "Press 'Join Alone' and get matched with 2-5 compatible people",
  },
  {
    icon: Sparkles,
    title: 'Meet Your Group',
    description: 'Chat with your group before the event and meet up together',
  },
];

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
    return (
      <div className="min-h-screen bg-background overflow-hidden">
        {/* Hero Section */}
        <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
          <motion.img
            src={heroImage}
            alt="People gathering at a social event"
            className="h-full w-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
            <StaggerContainer className="max-w-lg mx-auto md:max-w-xl">
              <StaggerItem>
                <Badge variant="soft" className="mb-4 px-4 py-1.5 text-sm">
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  Join events alone, leave with friends
                </Badge>
              </StaggerItem>
              
              <StaggerItem>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1] text-balance">
                  Meet new people at{' '}
                  <span className="gradient-brand-text">events you love</span>
                </h1>
              </StaggerItem>
              
              <StaggerItem>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
                  Discover events, join alone, and get matched into small groups of 2-5 people who share your interests.
                </p>
              </StaggerItem>
              
              <StaggerItem>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="xl"
                    variant="gradient"
                    className="w-full sm:w-auto"
                    onClick={() => navigate('/auth')}
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full sm:w-auto"
                    onClick={() => navigate('/explore')}
                  >
                    Browse Events
                  </Button>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-16 max-w-lg mx-auto md:max-w-3xl">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground">
              Three simple steps to make new friends
            </p>
          </FadeIn>
          
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <FadeIn key={feature.title} delay={0.1 * index}>
                <Card variant="elevated" className="p-6 h-full">
                  <div className="flex flex-col items-center text-center md:items-start md:text-left">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Sample Events */}
        {upcomingEvents.length > 0 && (
          <div className="px-6 pb-12 max-w-lg mx-auto md:max-w-3xl">
            <FadeIn className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
                <p className="text-muted-foreground text-sm">Events you can join today</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/explore" className="flex items-center gap-1">
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </FadeIn>
            
            <StaggerContainer className="grid gap-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <StaggerItem key={event.id}>
                  <EventCard event={event} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}

        {/* Footer CTA */}
        <div className="p-6 pb-16 max-w-lg mx-auto">
          <FadeIn>
            <Card variant="elevated" className="p-8 text-center bg-gradient-to-br from-primary/5 via-card to-accent/5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Ready to start gathering?</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Join thousands of people making new friends at events they love
              </p>
              <Button onClick={() => navigate('/auth')} size="lg" variant="gradient">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>
          </FadeIn>
        </div>
      </div>
    );
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
