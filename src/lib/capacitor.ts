import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Platform detection utilities for Capacitor
 */

// Check if running in native Capacitor environment
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Check if running on iOS
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

// Check if running on Android
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

// Check if running on web
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

// Get current platform
export type Platform = 'ios' | 'android' | 'web';
export const getPlatform = (): Platform => {
  return Capacitor.getPlatform() as Platform;
};

// Check if a plugin is available
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Haptic feedback utilities
 */
export const hapticFeedback = {
  light: async () => {
    if (isNative() && isPluginAvailable('Haptics')) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },
  medium: async () => {
    if (isNative() && isPluginAvailable('Haptics')) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },
  heavy: async () => {
    if (isNative() && isPluginAvailable('Haptics')) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  },
  vibrate: async () => {
    if (isNative() && isPluginAvailable('Haptics')) {
      await Haptics.vibrate();
    }
  },
};

/**
 * Status bar utilities
 */
export const statusBar = {
  setDark: async () => {
    if (isNative() && isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Dark });
    }
  },
  setLight: async () => {
    if (isNative() && isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Light });
    }
  },
  hide: async () => {
    if (isNative() && isPluginAvailable('StatusBar')) {
      await StatusBar.hide();
    }
  },
  show: async () => {
    if (isNative() && isPluginAvailable('StatusBar')) {
      await StatusBar.show();
    }
  },
  setBackgroundColor: async (color: string) => {
    if (isAndroid() && isPluginAvailable('StatusBar')) {
      await StatusBar.setBackgroundColor({ color });
    }
  },
};

/**
 * Splash screen utilities
 */
export const splashScreen = {
  hide: async () => {
    if (isNative() && isPluginAvailable('SplashScreen')) {
      await SplashScreen.hide();
    }
  },
  show: async () => {
    if (isNative() && isPluginAvailable('SplashScreen')) {
      await SplashScreen.show({
        autoHide: false,
      });
    }
  },
};

/**
 * App lifecycle utilities
 */
export const appLifecycle = {
  // Add listener for app state changes
  onStateChange: (callback: (isActive: boolean) => void) => {
    if (isNative() && isPluginAvailable('App')) {
      App.addListener('appStateChange', ({ isActive }) => {
        callback(isActive);
      });
    }
  },
  // Add listener for back button (Android)
  onBackButton: (callback: () => void) => {
    if (isAndroid() && isPluginAvailable('App')) {
      App.addListener('backButton', callback);
    }
  },
  // Add listener for app URL open (deep links)
  onAppUrlOpen: (callback: (url: string) => void) => {
    if (isNative() && isPluginAvailable('App')) {
      App.addListener('appUrlOpen', ({ url }) => {
        callback(url);
      });
    }
  },
  // Exit the app (Android only)
  exitApp: async () => {
    if (isAndroid() && isPluginAvailable('App')) {
      await App.exitApp();
    }
  },
  // Get app info
  getInfo: async () => {
    if (isNative() && isPluginAvailable('App')) {
      return await App.getInfo();
    }
    return null;
  },
};

/**
 * Initialize Capacitor plugins on app start
 */
export const initializeCapacitor = async () => {
  if (!isNative()) {
    console.log('[Capacitor] Running on web platform');
    return;
  }

  console.log(`[Capacitor] Running on ${getPlatform()} platform`);

  try {
    // Hide splash screen after app loads
    await splashScreen.hide();

    // Set status bar style
    await statusBar.setDark();

    // Set status bar background color on Android
    if (isAndroid()) {
      await statusBar.setBackgroundColor('#0a0a0a');
    }

    console.log('[Capacitor] Initialized successfully');
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error);
  }
};
