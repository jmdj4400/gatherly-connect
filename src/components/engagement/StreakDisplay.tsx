import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  category?: string | null;
  orgName?: string | null;
  compact?: boolean;
}

export function StreakDisplay({ 
  currentStreak, 
  longestStreak, 
  category, 
  orgName,
  compact = false 
}: StreakDisplayProps) {
  if (currentStreak === 0) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm font-medium">
        <Flame className="h-4 w-4" />
        <span>{currentStreak}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
      <div className="flex items-center justify-center h-12 w-12 bg-orange-500/20 rounded-full">
        <Flame className="h-6 w-6 text-orange-500" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-orange-600">{currentStreak}</span>
          <span className="text-sm text-muted-foreground">week streak</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {category || orgName || 'All events'} · Best: {longestStreak}
        </p>
      </div>
    </div>
  );
}