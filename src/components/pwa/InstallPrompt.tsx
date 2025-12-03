import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/lib/pwa';

interface InstallPromptProps {
  onDismiss?: () => void;
}

export function InstallPrompt({ onDismiss }: InstallPromptProps) {
  const { isInstalled, canInstall, install } = usePWAInstall();

  const handleInstall = async () => {
    const result = await install();
    if (result === 'accepted') {
      onDismiss?.();
    }
  };

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-card border shadow-xl rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1">Install Gatherly</h3>
              <p className="text-sm text-muted-foreground">
                Add to your home screen for the best experience
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 -mt-1 -mr-1"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onDismiss}
            >
              Not Now
            </Button>
            <Button
              className="flex-1"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// iOS specific install instructions
export function IOSInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = (window.navigator as any).standalone === true;

  if (!isIOS || isInStandaloneMode) return null;

  return (
    <div className="bg-muted/50 rounded-xl p-4 text-center">
      <p className="text-sm text-muted-foreground mb-2">
        To install on iOS:
      </p>
      <div className="flex items-center justify-center gap-2 text-sm">
        <span>Tap</span>
        <span className="inline-flex items-center justify-center h-6 w-6 bg-primary/10 rounded">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 12V20H20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </span>
        <span>then "Add to Home Screen"</span>
      </div>
    </div>
  );
}
