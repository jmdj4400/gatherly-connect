import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
}

export function EventCard({ event, participantCount = 0 }: EventCardProps) {
  const eventDate = new Date(event.starts_at);
  
  return (
    <Link to={`/events/${event.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="relative h-40 bg-muted">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                <Calendar className="h-12 w-12 text-primary/40" />
              </div>
            )}
            {event.allow_come_alone && (
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground font-semibold">
                Join Alone
              </Badge>
            )}
            {event.category && (
              <Badge variant="secondary" className="absolute top-3 left-3">
                {event.category}
              </Badge>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg line-clamp-1 mb-2">{event.title}</h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(eventDate, 'EEE, MMM d · h:mm a')}</span>
              </div>
              
              {(event.venue_name || event.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="line-clamp-1">
                    {event.venue_name || event.city}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{participantCount} interested</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
