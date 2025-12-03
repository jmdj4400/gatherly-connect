import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Plus, Calendar, Repeat, ChevronRight, 
  Instagram, Edit2, Trash2, MoreVertical, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PageLoader } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreateEventModal } from '@/components/organizer/CreateEventModal';
import { ShareAssetsModal } from '@/components/organizer/ShareAssetsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  venue_name: string | null;
  city: string | null;
  recurrence_type: string;
  recurrence_day: number | null;
  parent_event_id: string | null;
  children?: Event[];
}

const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

export default function OrganizerEvents() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shareModalEvent, setShareModalEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      checkOrgAdminStatus();
      fetchEvents();
    }
  }, [user, authLoading]);

  const checkOrgAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'org_admin')
      .maybeSingle();
    
    setIsOrgAdmin(!!data);
  };

  const fetchEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch events where user is org_admin
    const { data: userOrgs } = await supabase
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'org_admin');

    const orgIds = userOrgs?.map(r => r.org_id).filter(Boolean) || [];

    let query = supabase
      .from('events')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (orgIds.length > 0) {
      query = query.in('host_org_id', orgIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente events',
        variant: 'destructive',
      });
    } else {
      // Group events by parent
      const parentEvents: Event[] = [];
      const childrenMap: Record<string, Event[]> = {};

      (data || []).forEach((event: Event) => {
        if (event.parent_event_id) {
          if (!childrenMap[event.parent_event_id]) {
            childrenMap[event.parent_event_id] = [];
          }
          childrenMap[event.parent_event_id].push(event);
        } else {
          parentEvents.push(event);
        }
      });

      // Attach children to parents
      parentEvents.forEach(parent => {
        parent.children = childrenMap[parent.id] || [];
      });

      setEvents(parentEvents);
    }
    
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('da-DK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecurrenceLabel = (event: Event) => {
    if (event.recurrence_type === 'weekly' && event.recurrence_day !== null) {
      return `Hver ${DAY_NAMES[event.recurrence_day]}`;
    }
    if (event.recurrence_type === 'monthly') {
      return 'Månedligt';
    }
    return null;
  };

  if (authLoading || loading) {
    return <PageLoader message="Indlæser events..." />;
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Organizer Events</h1>
              <p className="text-xs text-muted-foreground">
                {events.length} aktive events
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nyt Event
          </Button>
        </div>
      </header>

      <div className="p-4">
        <StaggerContainer>
          {events.length === 0 ? (
            <StaggerItem>
              <GlassCard variant="subtle" className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Ingen events endnu</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Opret dit første event for at komme i gang
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opret Event
                </Button>
              </GlassCard>
            </StaggerItem>
          ) : (
            events.map((event) => (
              <StaggerItem key={event.id}>
                <GlassCard variant="elevated" className="p-4 mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.recurrence_type !== 'none' && (
                          <Badge variant="secondary" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            {getRecurrenceLabel(event)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.starts_at)}
                      </p>
                      {event.venue_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {event.venue_name}
                        </p>
                      )}
                      
                      {/* Show upcoming recurrences */}
                      {event.children && event.children.length > 0 && (
                        <div className="mt-3 pl-3 border-l-2 border-primary/20">
                          <p className="text-xs text-muted-foreground mb-2">
                            Kommende ({event.children.length})
                          </p>
                          {event.children.slice(0, 3).map(child => (
                            <p key={child.id} className="text-xs text-muted-foreground">
                              • {formatDate(child.starts_at)}
                            </p>
                          ))}
                          {event.children.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{event.children.length - 3} mere...
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareModalEvent(event)}
                      >
                        <Instagram className="h-4 w-4 mr-1" />
                        Del
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/organizer/events/${event.id}/groups`)}>
                            <Users className="h-4 w-4 mr-2" />
                            Se grupper
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/event/${event.id}`)}>
                            <ChevronRight className="h-4 w-4 mr-2" />
                            Se event
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Rediger
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Slet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </GlassCard>
              </StaggerItem>
            ))
          )}
        </StaggerContainer>
      </div>

      {/* Modals */}
      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={fetchEvents}
      />
      
      {shareModalEvent && (
        <ShareAssetsModal
          event={shareModalEvent}
          open={!!shareModalEvent}
          onOpenChange={(open) => !open && setShareModalEvent(null)}
        />
      )}
    </div>
  );
}
