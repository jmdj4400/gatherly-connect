import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Calendar, MapPin, Users, Bell, BellOff, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Community {
  id: string;
  name: string;
  org_handle: string;
  cover_image_url: string | null;
  short_bio: string | null;
  community_tags: string[] | null;
  contact_email: string | null;
}

interface Event {
  id: string;
  title: string;
  starts_at: string;
  venue_name: string | null;
  city: string | null;
  image_url: string | null;
  category: string | null;
}

export default function CommunityLanding() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (handle) {
      fetchCommunity();
    }
  }, [handle]);

  useEffect(() => {
    if (community && user) {
      checkFollowStatus();
    }
  }, [community, user]);

  const fetchCommunity = async () => {
    try {
      // Fetch community by handle
      const { data: org, error } = await supabase
        .from('orgs')
        .select('id, name, org_handle, cover_image_url, short_bio, community_tags, contact_email')
        .eq('org_handle', handle)
        .single();

      if (error || !org) {
        setLoading(false);
        return;
      }

      setCommunity(org as Community);

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, starts_at, venue_name, city, image_url, category')
        .eq('host_org_id', org.id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(6);

      setEvents(eventsData || []);

      // Get public follower count
      const { count } = await supabase
        .from('community_followers')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org.id);

      setFollowerCount(count || 0);
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!community || !user) return;
    
    const { data } = await supabase
      .from('community_followers')
      .select('id')
      .eq('org_id', community.id)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!community) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('community_followers')
          .delete()
          .eq('org_id', community.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        toast.success('Unfollowed community');
      } else {
        const { error } = await supabase
          .from('community_followers')
          .insert({ org_id: community.id, user_id: user.id });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
        toast.success('Following community! You will get notifications for new events.');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Something went wrong');
    } finally {
      setFollowLoading(false);
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
        <p className="text-muted-foreground mb-6">This community doesn't exist or hasn't been set up yet.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const siteUrl = window.location.origin;
  const pageUrl = `${siteUrl}/c/${community.org_handle}`;
  const ogImage = community.cover_image_url || `${siteUrl}/og-default.png`;

  return (
    <>
      <Helmet>
        <title>{community.name} | Gatherly</title>
        <meta name="description" content={community.short_bio || `Join ${community.name} on Gatherly`} />
        <meta property="og:title" content={community.name} />
        <meta property="og:description" content={community.short_bio || `Join ${community.name} and find your group`} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={community.name} />
        <meta name="twitter:description" content={community.short_bio || `Join ${community.name} on Gatherly`} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/30 to-accent/30">
          {community.cover_image_url && (
            <img
              src={community.cover_image_url}
              alt={community.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Community Info */}
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={community.cover_image_url || undefined} />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {community.name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{community.name}</h1>
              <p className="text-muted-foreground">@{community.org_handle}</p>
            </div>

            <Button
              onClick={handleFollow}
              disabled={followLoading}
              variant={isFollowing ? 'outline' : 'default'}
              className="md:self-center"
            >
              {isFollowing ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{followerCount} followers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{events.length} upcoming events</span>
            </div>
          </div>

          {/* Bio */}
          {community.short_bio && (
            <p className="text-foreground mb-6 max-w-2xl">{community.short_bio}</p>
          )}

          {/* Tags */}
          {community.community_tags && community.community_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {community.community_tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* CTA Card */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold mb-1">Join Alone → Get Matched</h2>
                <p className="text-muted-foreground">
                  Don't have anyone to go with? We'll match you with a group!
                </p>
              </div>
              <Button size="lg" onClick={() => navigate('/explore')}>
                Find Events
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
            
            {events.length === 0 ? (
              <p className="text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event, index) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${index === 0 ? 'md:col-span-2 lg:col-span-1 ring-2 ring-primary' : ''}`}
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    {event.image_url && (
                      <div className="h-32 overflow-hidden rounded-t-lg">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      {index === 0 && (
                        <Badge className="mb-2 bg-primary">Next Event</Badge>
                      )}
                      <h3 className="font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.starts_at), 'EEE, MMM d · HH:mm')}
                      </p>
                      {(event.venue_name || event.city) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue_name || event.city}
                        </p>
                      )}
                      <div className="flex items-center justify-end mt-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
