// Centralized notification utilities

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string; // For deduplication
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Generate notification deduplication tag
 */
export function generateNotificationTag(
  type: string,
  targetId: string,
  userId: string
): string {
  return `${type}-${targetId}-${userId}`;
}

/**
 * Check if notification was recently sent (deduplication)
 */
export async function wasNotificationSent(
  supabase: SupabaseClient,
  tag: string,
  withinMinutes: number = 60
): Promise<boolean> {
  // This would require a notification_log table
  // For now, we use the tag field in push notifications for deduplication
  console.log(`[notifications] Checking dedup for tag: ${tag}`);
  return false; // Implement with notification_log table if needed
}

/**
 * Get user's push subscriptions
 */
export async function getUserSubscriptions(
  supabase: SupabaseClient,
  userId: string
): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data.map(sub => ({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  }));
}

/**
 * Send push notification to user
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidKeys: { publicKey: string; privateKey: string }
): Promise<boolean> {
  try {
    // Note: Actual web-push implementation would go here
    // This is a placeholder for the notification sending logic
    console.log(`[notifications] Sending push to ${subscription.endpoint}`, {
      title: payload.title,
      tag: payload.tag,
    });
    
    // In production, use web-push library:
    // await webpush.sendNotification(subscription, JSON.stringify(payload));
    
    return true;
  } catch (error) {
    console.error('[notifications] Failed to send push:', error);
    return false;
  }
}

/**
 * Queue notification for retry
 */
export async function queueNotificationRetry(
  supabase: SupabaseClient,
  userId: string,
  payload: NotificationPayload,
  attempts: number = 0
): Promise<void> {
  // This would require a notification_queue table
  console.log(`[notifications] Queued retry for user ${userId}, attempt ${attempts + 1}`);
}

/**
 * Send notification to all user's devices
 */
export async function notifyUser(
  supabase: SupabaseClient,
  userId: string,
  payload: NotificationPayload,
  vapidKeys?: { publicKey: string; privateKey: string }
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getUserSubscriptions(supabase, userId);
  
  if (subscriptions.length === 0) {
    console.log(`[notifications] No subscriptions for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    if (vapidKeys) {
      const success = await sendPushNotification(subscription, payload, vapidKeys);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    } else {
      console.log(`[notifications] VAPID keys not provided, skipping push`);
      failed++;
    }
  }

  console.log(`[analytics] notification_sent`, {
    userId,
    title: payload.title,
    sent,
    failed,
    tag: payload.tag,
  });

  return { sent, failed };
}

/**
 * Create event reminder notification payload
 */
export function createEventReminderPayload(
  eventTitle: string,
  eventId: string,
  startsIn: string
): NotificationPayload {
  return {
    title: 'Event Reminder',
    body: `${eventTitle} starts ${startsIn}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: generateNotificationTag('event_reminder', eventId, ''),
    data: {
      type: 'event_reminder',
      eventId,
      url: `/event/${eventId}`,
    },
  };
}

/**
 * Create group assignment notification payload
 */
export function createGroupAssignmentPayload(
  eventTitle: string,
  groupId: string
): NotificationPayload {
  return {
    title: 'Group Assigned!',
    body: `You've been matched with a group for ${eventTitle}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: generateNotificationTag('group_assigned', groupId, ''),
    data: {
      type: 'group_assigned',
      groupId,
      url: `/groups/${groupId}/chat`,
    },
  };
}
