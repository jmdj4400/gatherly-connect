import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e69de0b4bdc64c90869d333dc3c5ea8a',
  appName: 'gatherlyconnect',
  webDir: 'dist',
  server: {
    url: 'https://e69de0b4-bdc6-4c90-869d-333dc3c5ea8a.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'gatherly',
    // Universal Links - add your domain in Apple Developer Portal
    // and configure apple-app-site-association file on server
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0a0a',
    // Deep links handled via intent-filter in AndroidManifest.xml
  },
};

export default config;
