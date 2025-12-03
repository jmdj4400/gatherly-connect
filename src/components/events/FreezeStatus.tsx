import { useState, useEffect } from 'react';
import { Snowflake, Clock, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { differenceInHours, differenceInMinutes, format } from 'date-fns';

interface FreezeStatusProps {
  startsAt: string;
  freezeHoursBefore?: number;
  className?: string;
}

export function FreezeStatus({ startsAt, freezeHoursBefore = 2, className = '' }: FreezeStatusProps) {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const eventStart = new Date(startsAt);
  const freezeTime = new Date(eventStart.getTime() - freezeHoursBefore * 60 * 60 * 1000);
  
  const isFrozen = now >= freezeTime;
  const hoursUntilFreeze = differenceInHours(freezeTime, now);
  const minutesUntilFreeze = differenceInMinutes(freezeTime, now) % 60;

  if (isFrozen) {
    return (
      <Badge variant="secondary" className={`gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ${className}`}>
        <Snowflake className="h-3 w-3" />
        Groups Finalized
      </Badge>
    );
  }

  if (hoursUntilFreeze <= 24) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <Clock className="h-3 w-3" />
        Groups lock in {hoursUntilFreeze}h {minutesUntilFreeze}m
      </Badge>
    );
  }

  return null;
}

interface FreezeCountdownProps {
  startsAt: string;
  freezeHoursBefore?: number;
  onFrozen?: () => void;
}

export function FreezeCountdown({ startsAt, freezeHoursBefore = 2, onFrozen }: FreezeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, frozen: false });

  useEffect(() => {
    const eventStart = new Date(startsAt);
    const freezeTime = new Date(eventStart.getTime() - freezeHoursBefore * 60 * 60 * 1000);

    const updateCountdown = () => {
      const now = new Date();
      const diff = freezeTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, frozen: true });
        onFrozen?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, frozen: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [startsAt, freezeHoursBefore, onFrozen]);

  if (timeLeft.frozen) {
    return (
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Lock className="h-4 w-4" />
        <span className="font-medium">Groups are finalized</span>
      </div>
    );
  }

  // Only show countdown within 24 hours
  if (timeLeft.hours >= 24) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span className="text-sm">
        Groups lock in{' '}
        <span className="font-mono font-medium">
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
}

export function useFreeze(startsAt: string, freezeHoursBefore: number = 2) {
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    const eventStart = new Date(startsAt);
    const freezeTime = new Date(eventStart.getTime() - freezeHoursBefore * 60 * 60 * 1000);
    
    const checkFreeze = () => {
      const now = new Date();
      setIsFrozen(now >= freezeTime);
    };

    checkFreeze();
    const interval = setInterval(checkFreeze, 60000);

    return () => clearInterval(interval);
  }, [startsAt, freezeHoursBefore]);

  return { isFrozen };
}
