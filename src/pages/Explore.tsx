import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, X, Map, List, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/events/EventCard';
import { RecommendedEventCard } from '@/components/events/RecommendedEventCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { GlassCard } from '@/components/ui/glass-card';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useRecommendedEvents } from '@/hooks/useRecommendedEvents';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🏕️' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🍹' },
];

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

export default function Explore() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showForYou, setShowForYou] = useState(true);

  const { 
    recommendations, 
    loading: recommendationsLoading, 
    logClick 
  } = useRecommendedEvents(6);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, profile?.city]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (profile?.city) {
      query = query.eq('city', profile.city);
    }

    const { data, error } = await query.limit(20);

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/30">
        <div className="p-4 space-y-4">
          {/* Location + View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{profile?.city || 'All Cities'}</p>
                <p className="text-xs text-muted-foreground">Events nearby</p>
              </div>
            </div>
            
            {/* View toggle */}
            <div className="flex items-center bg-muted/50 rounded-xl p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 rounded-lg"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 rounded-lg"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search events, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-12 bg-muted/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <motion.div
                key={category.id}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className={`cursor-pointer whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all rounded-xl ${
                    selectedCategory === category.id
                      ? 'shadow-soft'
                      : 'hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="mr-1.5">{category.emoji}</span>
                  {category.label}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6">
        {/* For You Section - only show for logged in users */}
        {user && showForYou && recommendations.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold">For You</h2>
                  <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowForYou(false)}
                className="rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {recommendationsLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
                {[1, 2, 3].map((i) => (
                  <GlassCard key={i} className="min-w-[280px] p-4">
                    <Skeleton className="h-32 rounded-xl mb-3" />
                    <Skeleton variant="text" className="w-3/4 mb-2" />
                    <Skeleton variant="text" className="w-1/2" />
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {recommendations.map((event) => (
                  <RecommendedEventCard
                    key={event.id}
                    event={event}
                    className="min-w-[280px] max-w-[280px]"
                    onClick={() => {
                      logClick(event.id);
                      navigate(`/event/${event.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* All Events Section */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4"
            >
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} className="p-4">
                  <Skeleton className="h-44 rounded-xl mb-4" />
                  <Skeleton variant="text" className="w-3/4 mb-2" />
                  <Skeleton variant="text" className="w-1/2" />
                </GlassCard>
              ))}
            </motion.div>
          ) : filteredEvents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={Calendar}
                title="No events found"
                description="Try adjusting your filters or check back later for new events"
                action={{
                  label: 'Clear Filters',
                  onClick: () => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </p>
              <StaggerContainer className="grid gap-4">
                {filteredEvents.map((event) => (
                  <StaggerItem key={event.id}>
                    <EventCard event={event} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
