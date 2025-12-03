import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { BoostedBadge } from '@/components/events/BoostedBadge';
import { format, isToday, isTomorrow } from 'date-fns';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    category: string | null;
    city: string | null;
    venue_name: string | null;
    starts_at: string;
    allow_come_alone: boolean;
  };
  participantCount?: number;
  variant?: 'default' | 'compact';
  isBoosted?: boolean;
  boostLevel?: 'basic' | 'pro';
}

export function EventCard({ event, participantCount = 0, variant = 'default', isBoosted, boostLevel }: EventCardProps) {
  const eventDate = new Date(event.starts_at);
  
  const getDateLabel = () => {
    if (isToday(eventDate)) return 'Today';
    if (isTomorrow(eventDate)) return 'Tomorrow';
    return format(eventDate, 'EEE, MMM d');
  };

  if (variant === 'compact') {
    return (
      <Link to={`/events/${event.id}`}>
        <GlassCard interactive variant="elevated" className="p-3">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1 mb-1">{event.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                <span>{getDateLabel()} · {format(eventDate, 'h:mm a')}</span>
              </div>
              {event.venue_name && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{event.venue_name}</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.id}`}>
      <GlassCard interactive variant="elevated" className="overflow-hidden">
        <div className="relative h-44 bg-muted">
          {event.image_url ? (
            <motion.img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
              <Calendar className="h-14 w-14 text-primary/30" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between">
            <div className="flex gap-2">
              {event.category && (
                <Badge variant="secondary" className="backdrop-blur-sm bg-card/80 text-xs font-medium">
                  {event.category}
                </Badge>
              )}
              {isBoosted && (
                <BoostedBadge level={boostLevel} size="sm" />
              )}
            </div>
            {event.allow_come_alone && (
              <Badge className="bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 text-xs">
                ✨ Join Alone
              </Badge>
            )}
          </div>
          
          {/* Date badge */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
              <p className="text-xs font-semibold text-primary">{getDateLabel()}</p>
              <p className="text-xs text-muted-foreground">{format(eventDate, 'h:mm a')}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 pt-3">
          <h3 className="font-semibold text-lg line-clamp-1 mb-2">{event.title}</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {(event.venue_name || event.city) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="line-clamp-1 max-w-[150px]">
                    {event.venue_name || event.city}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{participantCount}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
