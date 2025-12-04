import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appLifecycle, isNative } from '@/lib/capacitor';

/**
 * Deep link handler for native app
 * Handles URLs like:
 * - gatherly://event/123
 * - gatherly://chat/123
 * - https://gatherly.app/event/123
 */
export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative()) return;

    const handleDeepLink = (url: string) => {
      console.log('[DeepLink] Received URL:', url);
      
      try {
        // Parse the URL
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        
        // Handle custom scheme (gatherly://)
        if (url.startsWith('gatherly://')) {
          path = '/' + url.replace('gatherly://', '');
        }
        
        // Supported deep link patterns
        const patterns = [
          { regex: /^\/event\/([a-zA-Z0-9-]+)/, handler: (id: string) => `/event/${id}` },
          { regex: /^\/events\/([a-zA-Z0-9-]+)/, handler: (id: string) => `/event/${id}` },
          { regex: /^\/chat\/([a-zA-Z0-9-]+)/, handler: (id: string) => `/chat/${id}` },
          { regex: /^\/group\/([a-zA-Z0-9-]+)/, handler: (id: string) => `/chat/${id}` },
          { regex: /^\/c\/([a-zA-Z0-9-]+)/, handler: (handle: string) => `/c/${handle}` },
          { regex: /^\/profile/, handler: () => '/profile' },
          { regex: /^\/explore/, handler: () => '/explore' },
          { regex: /^\/groups/, handler: () => '/groups' },
        ];
        
        for (const { regex, handler } of patterns) {
          const match = path.match(regex);
          if (match) {
            const targetPath = handler(match[1]);
            console.log('[DeepLink] Navigating to:', targetPath);
            navigate(targetPath);
            return;
          }
        }
        
        // Default: navigate to home
        console.log('[DeepLink] No matching pattern, navigating to home');
        navigate('/');
      } catch (error) {
        console.error('[DeepLink] Error parsing URL:', error);
      }
    };

    // Listen for app URL open events
    appLifecycle.onAppUrlOpen(handleDeepLink);

    console.log('[DeepLink] Handler registered');
  }, [navigate]);

  return null;
}
