import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/lib/pwa';
import { isNative, hapticFeedback } from '@/lib/capacitor';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const native = isNative();

  const handleRetry = async () => {
    await hapticFeedback.medium();
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground safe-top"
        >
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            {native ? (
              <CloudOff className="h-5 w-5" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">Du er offline</span>
              {native && (
                <span className="text-xs opacity-80">Cached data vises</span>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-3 ml-2"
              onClick={handleRetry}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Prøv igen
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
