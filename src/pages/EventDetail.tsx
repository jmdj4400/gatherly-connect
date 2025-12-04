import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Heart, CheckCircle, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, differenceInMinutes } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { useVibeScore } from '@/hooks/useVibeScore';
import { VibeScoreBadge } from '@/components/ui/vibe-score-badge';
import { useEngagement } from '@/hooks/useEngagement';
import { FreezeStatus, FreezeCountdown, useFreeze } from '@/components/events/FreezeStatus';
import { useTranslation } from '@/lib/i18n';

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  city: string | null;
  venue_name: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  allow_come_alone: boolean;
  max_group_size: number;
  freeze_hours_before: number | null;
}

interface Participant {
  id: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { t, language } = useTranslation();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  
  const { eventVibeScore, loading: vibeLoading } = useVibeScore(id);
  const { checkIn } = useEngagement();
  const { isFrozen } = useFreeze(event?.starts_at || '', event?.freeze_hours_before || 2);

  const autoJoin = searchParams.get('autojoin') === 'true';
  const dateLocale = language === 'da' ? da : enUS;

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id, user]);

  // Handle auto-join from deep link (respect freeze state)
  useEffect(() => {
    if (autoJoin && !autoJoinAttempted && !loading && event && user && profile?.onboarding_completed && !isJoined && !isFrozen) {
      setAutoJoinAttempted(true);
      handleJoinAlone();
    }
  }, [autoJoin, autoJoinAttempted, loading, event, user, profile, isJoined, isFrozen]);

  const fetchEventDetails = async () => {
    setLoading(true);
    
    // Fetch event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventData) {
      setEvent(eventData);
    }

    // Fetch participants
    const { data: participantsData } = await supabase
      .from('event_participants')
      .select(`
        id,
        profiles (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('event_id', id)
      .eq('status', 'joined');

    if (participantsData) {
      setParticipants(participantsData as unknown as Participant[]);
    }

    // Check if current user has joined
    if (user) {
      const { data: userParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();

      setIsJoined(!!userParticipation);
      
      // Check if user has already checked in
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setHasCheckedIn(!!attendance);
    }

    setLoading(false);
  };

  const handleJoinAlone = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!profile?.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    setJoining(true);

    try {
      // Call the matching edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ event_id: id })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to join event');
      }

      setIsJoined(true);
      
      if (result.status === 'assigned') {
        toast({
          title: t('event.matched'),
          description: result.message || t('event.matched_desc')
        });
      } else if (result.status === 'forming') {
        toast({
          title: t('event.group_forming'),
          description: result.message || t('event.group_forming_desc')
        });
      } else {
        toast({
          title: t('event.youre_in'),
          description: result.message || t('event.youre_in_desc')
        });
      }

      // Refresh participants
      await fetchEventDetails();
    } catch (error: any) {
      toast({
        title: t('event.couldnt_join'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsJoined(false);
      toast({
        title: t('event.left'),
        description: t('event.left_desc')
      });

      await fetchEventDetails();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCheckIn = async () => {
    if (!user || !id) return;
    
    setCheckingIn(true);
    try {
      const result = await checkIn(id);
      
      if (result.success) {
        setHasCheckedIn(true);
        
        if (result.new_badges && result.new_badges.length > 0) {
          toast({
            title: `${t('event.badge_earned')} ${result.new_badges[0].icon}`,
            description: `${t('event.badge_earned_desc')} ${result.new_badges[0].name}!`
          });
        } else {
          toast({
            title: t('event.checked_in_success'),
            description: t('event.checked_in_desc')
          });
        }
      }
    } catch (error: any) {
      toast({
        title: t('event.checkin_failed'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold mb-2">{t('event.not_found')}</h2>
        <Button onClick={() => navigate('/explore')}>{t('event.browse')}</Button>
      </div>
    );
  }

  const eventDate = new Date(event.starts_at);
  const minutesUntilEvent = differenceInMinutes(eventDate, new Date());
  const canCheckIn = isJoined && minutesUntilEvent <= 30 && minutesUntilEvent >= -60; // 30 min before to 1 hour after
  const canJoin = !isFrozen && !isJoined;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Image */}
      <div className="relative h-64 bg-muted">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent" />
        )}
        
        {/* Back Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full bg-card/80 backdrop-blur"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full bg-card/80 backdrop-blur">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full bg-card/80 backdrop-blur">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 -mt-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {event.category && (
                <Badge>{event.category}</Badge>
              )}
              <FreezeStatus 
                startsAt={event.starts_at} 
                freezeHoursBefore={event.freeze_hours_before || 2} 
              />
            </div>
            {user && eventVibeScore !== null && !vibeLoading && (
              <VibeScoreBadge score={eventVibeScore} size="md" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(eventDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <span>{format(eventDate, 'HH:mm', { locale: dateLocale })}</span>
            </div>
            
            {(event.venue_name || event.address) && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.venue_name || event.address}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* About */}
        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold mb-2">{t('event.about')}</h2>
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </motion.div>
        )}

        {/* Participants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t('event.going_alone')}</h2>
            <span className="text-sm text-muted-foreground">{participants.length} {t('event.joined')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-3">
              {participants.slice(0, 5).map((p) => (
                <Avatar key={p.id} className="border-2 border-background h-10 w-10">
                  <AvatarImage src={p.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {p.profiles.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {participants.length > 5 && (
              <span className="text-sm text-muted-foreground ml-2">
                +{participants.length - 5} {t('event.more')}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA with safe area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 sticky-bottom-bar bg-gradient-to-t from-background via-background to-transparent">
        {/* Freeze countdown */}
        {!isFrozen && !isJoined && (
          <div className="mb-3 flex justify-center">
            <FreezeCountdown 
              startsAt={event.starts_at} 
              freezeHoursBefore={event.freeze_hours_before || 2} 
            />
          </div>
        )}

        {event.allow_come_alone && (
          isJoined ? (
            <div className="flex gap-3">
              {canCheckIn && !hasCheckedIn ? (
                <Button
                  className="flex-1 h-14 font-semibold bg-green-600 hover:bg-green-700"
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {checkingIn ? t('event.checking_in') : t('event.check_in')}
                </Button>
              ) : hasCheckedIn ? (
                <Button
                  variant="outline"
                  className="flex-1 h-14 border-green-500 text-green-600"
                  disabled
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {t('event.checked_in')}
                </Button>
              ) : !isFrozen ? (
                <Button
                  variant="outline"
                  className="flex-1 h-14"
                  onClick={handleLeave}
                >
                  {t('event.leave')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 h-14"
                  disabled
                >
                  <Snowflake className="mr-2 h-4 w-4" />
                  {t('event.groups_locked')}
                </Button>
              )}
              <Button
                className="flex-1 h-14 font-semibold"
                onClick={() => navigate('/groups')}
              >
                <Users className="mr-2 h-5 w-5" />
                {t('event.view_group')}
              </Button>
            </div>
          ) : isFrozen ? (
            <Button
              className="w-full h-14 text-lg font-semibold"
              disabled
              variant="secondary"
            >
              <Snowflake className="mr-2 h-5 w-5" />
              {t('event.groups_finalized')}
            </Button>
          ) : (
            <Button
              className="w-full h-14 text-lg font-semibold"
              onClick={handleJoinAlone}
              disabled={joining}
            >
              {joining ? (
                t('event.joining')
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  {t('event.join_alone')}
                </>
              )}
            </Button>
          )
        )}
      </div>
    </div>
  );
}