import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Badge {
  name: string;
  description: string;
  icon: string;
  slug: string;
  awarded_at?: string;
}

interface BadgeGridProps {
  badges: Badge[];
  showAll?: boolean;
}

const ALL_BADGES: Badge[] = [
  { slug: 'attendance_3', name: 'Regular', description: 'Attended 3 events', icon: '🌟' },
  { slug: 'attendance_10', name: 'Dedicated', description: 'Attended 10 events', icon: '🏅' },
  { slug: 'attendance_25', name: 'Legend', description: 'Attended 25 events', icon: '👑' },
  { slug: 'streak_3', name: 'On Fire', description: '3 week streak', icon: '🔥' },
  { slug: 'streak_10', name: 'Unstoppable', description: '10 week streak', icon: '💪' },
  { slug: 'early_bird', name: 'Early Bird', description: 'Arrived 15+ min early 5 times', icon: '🐦' },
  { slug: 'host_1', name: 'Event Host', description: 'Hosted your first event', icon: '🎤' },
  { slug: 'host_5', name: 'Community Leader', description: 'Hosted 5 events', icon: '🌟' },
];

export function BadgeGrid({ badges, showAll = false }: BadgeGridProps) {
  const earnedSlugs = new Set(badges.map(b => b.slug));

  const displayBadges = showAll 
    ? ALL_BADGES.map(badge => ({
        ...badge,
        earned: earnedSlugs.has(badge.slug),
        awarded_at: badges.find(b => b.slug === badge.slug)?.awarded_at
      }))
    : badges.map(b => ({ ...b, earned: true }));

  if (displayBadges.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          No badges earned yet. Keep attending events!
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 gap-3">
        {displayBadges.map((badge, index) => (
          <Tooltip key={badge.slug || index}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all cursor-pointer",
                  badge.earned
                    ? "bg-primary/10 border border-primary/20 shadow-soft"
                    : "bg-muted/30 opacity-40 grayscale"
                )}
              >
                <span className="text-2xl mb-1.5">{badge.icon}</span>
                <span className="text-[11px] font-medium text-center line-clamp-1">
                  {badge.name}
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] p-3">
              <p className="font-semibold">{badge.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
              {badge.earned && badge.awarded_at && (
                <p className="text-xs text-primary mt-1.5 font-medium">
                  Earned {format(new Date(badge.awarded_at), 'MMM d, yyyy')}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
