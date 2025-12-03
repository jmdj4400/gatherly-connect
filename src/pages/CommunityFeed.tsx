import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Award, Flame, ArrowLeft } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  feed_type: string;
  user_id: string | null;
  event_id: string | null;
  metadata: any;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  event?: {
    title: string;
    starts_at: string;
  };
}

interface Community {
  id: string;
  name: string;
  org_handle: string;
}

export default function CommunityFeed() {
  const { handle } = useParams<{ handle: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [topStreaks, setTopStreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) {
      fetchCommunityData();
    }
  }, [handle]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!community) return;

    const channel = supabase
      .channel('community-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_feed',
          filter: `org_id=eq.${community.id}`
        },
        (payload) => {
          fetchFeedItems(community.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [community]);

  const fetchCommunityData = async () => {
    try {
      // Get community
      const { data: org, error } = await supabase
        .from('orgs')
        .select('id, name, org_handle')
        .eq('org_handle', handle)
        .single();

      if (error || !org) {
        setLoading(false);
        return;
      }

      setCommunity(org);

      // Fetch data in parallel
      await Promise.all([
        fetchFeedItems(org.id),
        fetchUpcomingEvents(org.id),
        fetchTopStreaks(org.id)
      ]);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedItems = async (orgId: string) => {
    const { data: items } = await supabase
      .from('community_feed')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (items && items.length > 0) {
      // Fetch profiles for user items
      const userIds = [...new Set(items.filter(i => i.user_id).map(i => i.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      setFeedItems(items.map(item => ({
        ...item,
        profile: item.user_id ? profileMap.get(item.user_id) : undefined
      })));
    } else {
      setFeedItems([]);
    }
  };

  const fetchUpcomingEvents = async (orgId: string) => {
    const { data } = await supabase
      .from('events')
      .select('id, title, starts_at, venue_name')
      .eq('host_org_id', orgId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5);

    setUpcomingEvents(data || []);
  };

  const fetchTopStreaks = async (orgId: string) => {
    const { data } = await supabase
      .from('user_streaks')
      .select(`
        current_streak,
        category,
        user_id,
        profiles(display_name, avatar_url)
      `)
      .eq('org_id', orgId)
      .gt('current_streak', 0)
      .order('current_streak', { ascending: false })
      .limit(10);

    setTopStreaks(data || []);
  };

  const renderFeedItem = (item: FeedItem) => {
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

    switch (item.feed_type) {
      case 'member_joined':
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{item.profile?.display_name || 'Someone'}</span>
                {' '}joined the community
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        );

      case 'badge_earned':
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-xl">{item.metadata?.badge_icon || '🏆'}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{item.profile?.display_name || 'Someone'}</span>
                {' '}earned the <Badge variant="secondary">{item.metadata?.badge_name}</Badge> badge
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        );

      case 'streak_milestone':
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{item.profile?.display_name || 'Someone'}</span>
                {' '}reached a {item.metadata?.streak_count} week streak! 🔥
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        );

      case 'event_created':
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                New event: <span className="font-semibold">{item.metadata?.event_title}</span>
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-2">Community not found</h1>
        <Link to="/" className="text-primary hover:underline">Go Home</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{community.name} Feed | Gatherly</title>
        <meta name="description" content={`Latest activity from ${community.name}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b p-4">
          <div className="flex items-center gap-3">
            <Link to={`/c/${handle}`} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">{community.name}</h1>
              <p className="text-sm text-muted-foreground">Community Feed</p>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-3">
              {feedItems.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No activity yet</p>
                  </CardContent>
                </Card>
              ) : (
                feedItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="py-3">
                      {renderFeedItem(item)}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No upcoming events</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingEvents.map((event) => (
                  <Link key={event.id} to={`/event/${event.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.starts_at), 'EEE, MMM d · HH:mm')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Top Streaks
              </h3>
              {topStreaks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No streaks yet. Be the first!</p>
                  </CardContent>
                </Card>
              ) : (
                topStreaks.map((streak, index) => (
                  <Card key={`${streak.user_id}-${index}`}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={streak.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {streak.profiles?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {streak.profiles?.display_name || 'Anonymous'}
                          </p>
                          {streak.category && (
                            <p className="text-xs text-muted-foreground">{streak.category}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full font-bold">
                          <Flame className="h-4 w-4" />
                          {streak.current_streak}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}