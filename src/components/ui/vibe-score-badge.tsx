import { motion } from 'framer-motion';
import { Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VibeScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VibeScoreBadge({ score, size = 'md', showLabel = true, className }: VibeScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-primary to-orange-500';
    if (score >= 40) return 'from-yellow-500 to-amber-500';
    return 'from-muted-foreground to-muted-foreground/70';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Perfect Match!';
    if (score >= 80) return 'Great Vibe';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Okay Match';
    return 'Low Match';
  };

  const getIcon = (score: number) => {
    if (score >= 80) return Sparkles;
    if (score >= 60) return Star;
    return Zap;
  };

  const Icon = getIcon(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        'bg-gradient-to-r text-white shadow-md',
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{score}%</span>
      {showLabel && size !== 'sm' && (
        <span className="hidden sm:inline opacity-90">· {getScoreLabel(score)}</span>
      )}
    </motion.div>
  );
}

interface BestMatchTagProps {
  className?: string;
}

export function BestMatchTag({ className }: BestMatchTagProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
        'text-xs font-semibold shadow-sm',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      Best Match
    </motion.div>
  );
}
