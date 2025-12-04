import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { appLifecycle, isAndroid, hapticFeedback } from '@/lib/capacitor';
import { toast } from 'sonner';

const ROOT_PATHS = ['/', '/explore', '/groups', '/profile'];

export function useNativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    if (!isAndroid()) return;

    const handleBackButton = async () => {
      const now = Date.now();
      const isRootPath = ROOT_PATHS.includes(location.pathname);

      if (isRootPath) {
        // On root paths, double-tap to exit
        if (now - lastBackPress.current < 2000) {
          await appLifecycle.exitApp();
        } else {
          lastBackPress.current = now;
          await hapticFeedback.light();
          toast('Tryk igen for at lukke', {
            duration: 2000,
            position: 'bottom-center',
          });
        }
      } else {
        // Navigate back in history
        await hapticFeedback.light();
        navigate(-1);
      }
    };

    appLifecycle.onBackButton(handleBackButton);
  }, [navigate, location.pathname]);
}
