import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Sparkles, ArrowRight, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EventCard } from '@/components/events/EventCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { GlassCard } from '@/components/ui/glass-card';
import { StaggerContainer, StaggerItem, buttonTapVariants } from '@/components/ui/page-transition';
import { SkeletonLoader, PageLoader } from '@/components/ui/loading-spinner';
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
    gradient: 'from-primary/20 to-primary/5',
  },
  {
    icon: Users,
    title: 'Join Alone',
    description: "Press 'Join Alone' and we'll match you with 2-5 compatible people",
    gradient: 'from-accent/30 to-accent/5',
  },
  {
    icon: Sparkles,
    title: 'Meet Your Group',
    description: 'Chat with your group before the event and meet up together',
    gradient: 'from-primary/15 to-accent/10',
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
        <div className="relative h-[75vh] overflow-hidden">
          <motion.img
            src={heroImage}
            alt="People gathering at a social event"
            className="h-full w-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
            <StaggerContainer>
              <StaggerItem>
                <Badge className="mb-4 bg-primary/90 backdrop-blur-sm shadow-lg px-4 py-1.5 text-sm font-medium">
                  ✨ Join events alone, leave with friends
                </Badge>
              </StaggerItem>
              
              <StaggerItem>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
                  Meet new people at{' '}
                  <span className="text-primary">events you love</span>
                </h1>
              </StaggerItem>
              
              <StaggerItem>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
                  Discover events, join alone, and get matched into small groups of 2-5 people who share your interests.
                </p>
              </StaggerItem>
              
              <StaggerItem>
                <div className="flex flex-col gap-3">
                  <motion.div
                    variants={buttonTapVariants}
                    initial="initial"
                    whileTap="tap"
                  >
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/25"
                      onClick={() => navigate('/auth')}
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                  <motion.div
                    variants={buttonTapVariants}
                    initial="initial"
                    whileTap="tap"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-14 backdrop-blur-sm bg-card/50"
                      onClick={() => navigate('/explore')}
                    >
                      Browse Events
                    </Button>
                  </motion.div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-12 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold tracking-tight mb-2">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to make new friends</p>
          </motion.div>
          
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="elevated" className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Step {index + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sample Events */}
        {upcomingEvents.length > 0 && (
          <div className="px-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
                <p className="text-muted-foreground text-sm">Events you can join today</p>
              </div>
              <Link to="/explore" className="text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
            
            <div className="grid gap-4">
              {upcomingEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlassCard variant="elevated" className="p-8 text-center bg-gradient-to-br from-primary/10 via-card to-accent/10">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to start gathering?</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Join thousands of people making new friends at events they love
              </p>
              <motion.div
                variants={buttonTapVariants}
                initial="initial"
                whileTap="tap"
              >
                <Button onClick={() => navigate('/auth')} size="lg" className="font-semibold shadow-lg shadow-primary/25">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageLoader message="Loading your feed..." />;
  }

  // Authenticated home feed
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold tracking-tight">
                Hey, {profile?.display_name?.split(' ')[0] || 'there'} 👋
              </h1>
              {profile?.city && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.city}</span>
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Link to="/profile">
                <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-medium">
                    {profile?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Onboarding reminder */}
      {profile && !profile.onboarding_completed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4"
        >
          <GlassCard variant="elevated" className="p-4 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Complete your profile</h3>
                <p className="text-sm text-muted-foreground">
                  Help us match you with the right people
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/onboarding')}>
                Continue
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Content */}
      <main className="p-4 space-y-6 mt-2">
        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Events for You</h2>
              <p className="text-xs text-muted-foreground">Based on your interests</p>
            </div>
            <Link to="/explore" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex gap-4">
                    <SkeletonLoader className="h-24 w-24 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLoader variant="text" className="w-3/4" />
                      <SkeletonLoader variant="text" className="w-1/2" />
                      <SkeletonLoader variant="text" className="w-1/3" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <GlassCard variant="subtle" className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No events yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check back soon for events in your area
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/explore')}>
                Browse All Events
              </Button>
            </GlassCard>
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
