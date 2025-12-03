import { supabase } from '@/integrations/supabase/client';

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Get current notification permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isNotificationSupported()) return 'unsupported';
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Fetch VAPID public key from backend
let cachedVapidKey: string | null = null;

const getVapidPublicKey = async (): Promise<string | null> => {
  if (cachedVapidKey) return cachedVapidKey;
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    
    if (error || !data?.publicKey) {
      console.error('Failed to fetch VAPID public key:', error);
      return null;
    }
    
    cachedVapidKey = data.publicKey;
    return cachedVapidKey;
  } catch (error) {
    console.error('Error fetching VAPID public key:', error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (userId: string): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.log('[notifications] Push not supported');
    return false;
  }
  
  try {
    console.log('[notifications] Checking service worker...');
    
    // Check if service worker is registered
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('[notifications] Service worker registrations:', registrations.length);
    
    if (registrations.length === 0) {
      console.log('[notifications] No service worker registered, attempting registration...');
      // Try to register the service worker
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('[notifications] Service worker registered');
      } catch (swError) {
        console.error('[notifications] Service worker registration failed:', swError);
        return false;
      }
    }
    
    const registration = await navigator.serviceWorker.ready;
    console.log('[notifications] Service worker ready');
    
    // Get VAPID public key from backend
    const vapidPublicKey = await getVapidPublicKey();
    
    if (!vapidPublicKey) {
      console.error('[notifications] VAPID public key not available');
      return false;
    }
    
    console.log('[notifications] VAPID key obtained, subscribing to push...');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    console.log('[notifications] Push subscription created, saving to backend...');

    // Send subscription to backend
    const { error } = await supabase.functions.invoke('push-subscribe', {
      body: {
        subscription: subscription.toJSON(),
        user_id: userId,
      },
    });

    if (error) {
      console.error('[notifications] Error saving push subscription:', error);
      return false;
    }

    console.log('[notifications] Push subscription saved successfully');
    return true;
  } catch (error) {
    console.error('[notifications] Error subscribing to push:', error);
    return false;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
};

// Show local notification
export const showLocalNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      ...options,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Notification types
export type NotificationType = 
  | 'group_created'
  | 'new_message'
  | 'event_starts_24h'
  | 'event_starts_1h';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}
