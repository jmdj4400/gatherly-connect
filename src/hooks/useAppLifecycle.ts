import { useEffect, useRef, useCallback } from 'react';
import { appLifecycle, isNative } from '@/lib/capacitor';
import { useQueryClient } from '@tanstack/react-query';

interface UseAppLifecycleOptions {
  onResume?: () => void;
  onPause?: () => void;
  refreshStaleDataAfterMs?: number;
}

export function useAppLifecycle(options: UseAppLifecycleOptions = {}) {
  const { onResume, onPause, refreshStaleDataAfterMs = 5 * 60 * 1000 } = options;
  const queryClient = useQueryClient();
  const pausedAt = useRef<number | null>(null);

  const handleStateChange = useCallback((isActive: boolean) => {
    if (isActive) {
      // App resumed
      const now = Date.now();
      const wasPausedFor = pausedAt.current ? now - pausedAt.current : 0;
      
      // Refresh stale data if paused for too long
      if (wasPausedFor > refreshStaleDataAfterMs) {
        queryClient.invalidateQueries();
      }
      
      pausedAt.current = null;
      onResume?.();
    } else {
      // App paused
      pausedAt.current = Date.now();
      onPause?.();
    }
  }, [queryClient, refreshStaleDataAfterMs, onResume, onPause]);

  useEffect(() => {
    if (!isNative()) return;
    
    appLifecycle.onStateChange(handleStateChange);
  }, [handleStateChange]);

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
