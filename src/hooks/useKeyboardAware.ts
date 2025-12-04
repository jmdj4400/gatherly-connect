import { useState, useEffect, useCallback } from 'react';
import { isNative, isIOS } from '@/lib/capacitor';

export function useKeyboardAware() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!isNative()) return;

    // Use visualViewport API for keyboard detection
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const heightDiff = window.innerHeight - viewport.height;
      
      if (heightDiff > 100) {
        setKeyboardHeight(heightDiff);
        setIsKeyboardVisible(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  const scrollToInput = useCallback((element: HTMLElement | null) => {
    if (!element || !isKeyboardVisible) return;
    
    // Small delay to let keyboard fully open
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [isKeyboardVisible]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    scrollToInput,
    // Extra padding for iOS to account for safe area
    bottomPadding: isIOS() ? keyboardHeight : Math.max(keyboardHeight - 20, 0),
  };
}
