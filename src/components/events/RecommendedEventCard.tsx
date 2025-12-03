import { motion } from 'framer-motion';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { format } from 'date-fns';
import { RecommendedEvent } from '@/hooks/useRecommendedEvents';
import { cn } from '@/lib/utils';

interface RecommendedEventCardProps {
  event: RecommendedEvent;
  onClick?: () => void;
  className?: string;
}

export function RecommendedEventCard({ event, onClick, className }: RecommendedEventCardProps) {
  const eventDate = new Date(event.starts_at);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn('cursor-pointer', className)}
    >
      <GlassCard variant="elevated" className="overflow-hidden p-0">
        <div className="relative h-32">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          
          {/* Match Score Badge */}
          <div className="absolute top-2.5 right-2.5">
            <Badge 
              className={cn(
                'bg-card/95 backdrop-blur-sm border-0 font-semibold shadow-soft',
                getScoreColor(event.recommendation_score)
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {event.recommendation_score}% match
            </Badge>
          </div>

          {/* Category Badge */}
          {event.category && (
            <div className="absolute bottom-2.5 left-2.5">
              <Badge variant="secondary" className="bg-card/95 backdrop-blur-sm shadow-soft">
                {event.category}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold line-clamp-1 mb-2">{event.title}</h3>
          
          <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(eventDate, 'EEE, MMM d · h:mm a')}</span>
            </div>
            {(event.venue_name || event.city) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{event.venue_name || event.city}</span>
              </div>
            )}
          </div>

          {/* Why Recommended */}
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Why recommended:</p>
            <div className="flex flex-wrap gap-1.5">
              {event.recommendation_reasons.map((reason, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="text-[11px] font-normal bg-primary/5 border-primary/20"
                >
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
