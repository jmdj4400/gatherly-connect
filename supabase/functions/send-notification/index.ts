import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType = 
  | 'group_created'
  | 'new_message'
  | 'event_starts_24h'
  | 'event_starts_1h';

interface NotificationRequest {
  type: NotificationType;
  user_ids: string[];
  data: Record<string, string>;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  group_created: {
    title: '🎉 Din gruppe er klar!',
    body: 'Du er matchet med {count} andre til {event}. Sig hej!',
  },
  new_message: {
    title: '💬 Ny besked',
    body: '{sender}: {preview}',
  },
  event_starts_24h: {
    title: '📅 Event i morgen!',
    body: '{event} starter i morgen. Husk at mødes med din gruppe!',
  },
  event_starts_1h: {
    title: '⏰ Starter snart!',
    body: '{event} starter om 1 time. Tid til at tage afsted!',
  },
};

// Simple Web Push sender using fetch
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; data?: Record<string, string> },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; statusCode?: number }> {
  try {
    // Create JWT for VAPID
    const audience = new URL(subscription.endpoint).origin;
    const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    
    const header = { alg: 'ES256', typ: 'JWT' };
    const jwtPayload = {
      aud: audience,
      exp: expiration,
      sub: 'mailto:noreply@gatherly.app',
    };

    // Base64url encode
    const base64url = (data: string): string => {
      return btoa(data)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(jwtPayload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Import private key and sign
    const privateKeyBuffer = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureBase64 = base64url(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${unsignedToken}.${signatureBase64}`;

    // Send the notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[send-notification] Push response: ${response.status}`);

    if (response.status === 201 || response.status === 200) {
      return { success: true, statusCode: response.status };
    }

    // Handle specific error codes
    if (response.status === 410 || response.status === 404) {
      // Subscription expired or invalid
      return { success: false, statusCode: response.status };
    }

    const errorText = await response.text();
    console.error(`[send-notification] Push failed: ${response.status} - ${errorText}`);
    return { success: false, statusCode: response.status };
  } catch (error) {
    console.error('[send-notification] Push error:', error);
    return { success: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, user_ids, data }: NotificationRequest = await req.json();

    if (!type || !user_ids || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing type or user_ids' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Interpolate template with data
    let title = template.title;
    let body = template.body;
    
    for (const [key, value] of Object.entries(data || {})) {
      title = title.replace(`{${key}}`, value);
      body = body.replace(`{${key}}`, value);
    }

    console.log(`[send-notification] type=${type} users=${user_ids.length}`);
    console.log(`[send-notification] title="${title}" body="${body}"`);

    // Check if VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log('[send-notification] VAPID keys not configured, logging only');
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent_to: 0,
          message: 'VAPID keys not configured',
          title,
          body,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch push subscriptions for user_ids
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', user_ids);

    if (fetchError) {
      console.error('[send-notification] Failed to fetch subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[send-notification] No subscriptions found for users');
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent_to: 0,
          message: 'No subscriptions found',
          title,
          body,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-notification] Found ${subscriptions.length} subscriptions`);

    const payload = {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      data: { type, ...data },
    };

    let successCount = 0;
    let failedCount = 0;
    const expiredSubscriptionIds: string[] = [];

    // Send notifications to all subscriptions
    for (const sub of subscriptions) {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (result.success) {
        successCount++;
        console.log(`[send-notification] Sent to user ${sub.user_id}`);
      } else {
        failedCount++;
        // Mark expired subscriptions for deletion (410 Gone or 404 Not Found)
        if (result.statusCode === 410 || result.statusCode === 404) {
          expiredSubscriptionIds.push(sub.id);
        }
        console.log(`[send-notification] Failed for user ${sub.user_id}`);
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptionIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptionIds);
      
      if (deleteError) {
        console.error('[send-notification] Failed to delete expired subscriptions:', deleteError);
      } else {
        console.log(`[send-notification] Deleted ${expiredSubscriptionIds.length} expired subscriptions`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent_to: successCount,
        failed: failedCount,
        title,
        body,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[send-notification] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
