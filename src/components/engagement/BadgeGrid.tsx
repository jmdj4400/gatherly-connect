import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      <p className="text-sm text-muted-foreground text-center py-4">
        No badges earned yet. Keep attending events!
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 gap-3">
        {displayBadges.map((badge, index) => (
          <Tooltip key={badge.slug || index}>
            <TooltipTrigger asChild>
              <div
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  badge.earned
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs font-medium text-center line-clamp-1">
                  {badge.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="font-semibold">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {badge.earned && badge.awarded_at && (
                <p className="text-xs text-primary mt-1">
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