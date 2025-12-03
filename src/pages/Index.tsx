import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/events/EventCard';
import { BottomNav } from '@/components/layout/BottomNav';
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
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative h-[70vh] overflow-hidden">
          <img
            src={heroImage}
            alt="People gathering at a social event"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/90">Join events alone, leave with friends</Badge>
              <h1 className="text-4xl font-bold mb-3">
                Meet new people at events you love
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Discover events, join alone, and get matched into small groups of 2-5 people who share your interests.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14"
                  onClick={() => navigate('/explore')}
                >
                  Browse Events
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features */}
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold">How it works</h2>
          
          <div className="grid gap-4">
            {[
              {
                icon: Calendar,
                title: 'Find Events',
                description: 'Discover events happening near you that match your interests'
              },
              {
                icon: Users,
                title: 'Join Alone',
                description: 'Press "Join Alone" and we\'ll match you with 2-5 compatible people'
              },
              {
                icon: Sparkles,
                title: 'Meet Your Group',
                description: 'Chat with your group before the event and meet up together'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="flex items-start gap-4 p-4 bg-card rounded-xl"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sample Events */}
        {upcomingEvents.length > 0 && (
          <div className="p-6 pt-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <Link to="/explore" className="text-primary font-medium flex items-center gap-1">
                See all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid gap-4">
              {upcomingEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="p-6 pb-12">
          <div className="bg-gradient-to-br from-primary/20 to-accent p-6 rounded-2xl text-center">
            <h3 className="text-xl font-bold mb-2">Ready to start gathering?</h3>
            <p className="text-muted-foreground mb-4">
              Join thousands of people making new friends at events
            </p>
            <Button onClick={() => navigate('/auth')} className="font-semibold">
              Create Free Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated home feed
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold">
                Hey, {profile?.display_name?.split(' ')[0] || 'there'} 👋
              </h1>
              {profile?.city && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.city}</span>
                </div>
              )}
            </div>
            <Link to="/profile">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg">
                  {profile?.display_name?.[0] || '👤'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Redirect to onboarding if not completed */}
      {profile && !profile.onboarding_completed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-4 bg-accent rounded-xl"
        >
          <h3 className="font-semibold mb-1">Complete your profile</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Help us match you with the right people
          </p>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            Continue Setup
          </Button>
        </motion.div>
      )}

      {/* Content */}
      <main className="p-4 space-y-6">
        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Events for You</h2>
            <Link to="/explore" className="text-primary text-sm font-medium flex items-center gap-1">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No events yet</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Check back soon for events in your area
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/explore')}>
                Browse All Events
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
