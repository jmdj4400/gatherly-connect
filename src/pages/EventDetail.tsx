import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

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
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id, user]);

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
      // Add participant
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: id,
          user_id: user.id,
          status: 'joined'
        });

      if (participantError) throw participantError;

      setIsJoined(true);
      toast({
        title: "You're in! 🎉",
        description: "We'll match you with your group soon. Check your groups page!"
      });

      // Refresh participants
      await fetchEventDetails();
    } catch (error: any) {
      toast({
        title: "Couldn't join event",
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
        title: "You've left the event",
        description: "You can rejoin anytime before it starts."
      });

      await fetchEventDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
        <h2 className="text-xl font-semibold mb-2">Event not found</h2>
        <Button onClick={() => navigate('/explore')}>Browse Events</Button>
      </div>
    );
  }

  const eventDate = new Date(event.starts_at);

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
          {event.category && (
            <Badge className="mb-3">{event.category}</Badge>
          )}
          
          <h1 className="text-2xl font-bold mb-4">{event.title}</h1>

          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <span>{format(eventDate, 'h:mm a')}</span>
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
            <h2 className="text-lg font-semibold mb-2">About</h2>
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
            <h2 className="text-lg font-semibold">Going Alone</h2>
            <span className="text-sm text-muted-foreground">{participants.length} joined</span>
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
                +{participants.length - 5} more
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        {event.allow_come_alone && (
          isJoined ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14"
                onClick={handleLeave}
              >
                Leave Event
              </Button>
              <Button
                className="flex-1 h-14 font-semibold"
                onClick={() => navigate('/groups')}
              >
                <Users className="mr-2 h-5 w-5" />
                View My Group
              </Button>
            </div>
          ) : (
            <Button
              className="w-full h-14 text-lg font-semibold"
              onClick={handleJoinAlone}
              disabled={joining}
            >
              {joining ? (
                'Joining...'
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Join Alone
                </>
              )}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
