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
  dedupe_key?: string; // Optional key for deduplication
}

// Generate deduplication key
function generateDedupeKey(type: NotificationType, userId: string, data: Record<string, string>): string {
  const parts = [type, userId];
  if (data.event_id) parts.push(data.event_id);
  if (data.group_id) parts.push(data.group_id);
  return parts.join(':');
}

// In-memory deduplication cache (TTL: 5 minutes)
const sentNotifications = new Map<string, number>();
const DEDUPE_TTL_MS = 5 * 60 * 1000;

function isDuplicate(dedupeKey: string): boolean {
  const now = Date.now();
  // Clean expired entries
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (now - timestamp > DEDUPE_TTL_MS) {
      sentNotifications.delete(key);
    }
  }
  return sentNotifications.has(dedupeKey);
}

function markSent(dedupeKey: string): void {
  sentNotifications.set(dedupeKey, Date.now());
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

// Base64url encoding/decoding utilities
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

// Create VAPID JWT
async function createVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400, // 24 hours
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key for signing
  const privateKeyBytes = base64UrlDecode(privateKey);
  
  // Create JWK from raw private key
  const publicKeyBytes = base64UrlDecode(publicKey);
  
  // Extract x and y coordinates from public key (skip first byte which is 0x04 uncompressed marker)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
    d: base64UrlEncode(privateKeyBytes),
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  // Convert signature from DER to raw format (r || s)
  const sigArray = new Uint8Array(signature);
  const signatureB64 = base64UrlEncode(sigArray);

  return `${unsignedToken}.${signatureB64}`;
}

// Send web push notification
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const endpoint = new URL(subscription.endpoint);
    const audience = endpoint.origin;

    // Create VAPID JWT
    const jwt = await createVapidJwt(
      audience,
      'mailto:noreply@gatherly.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: new TextEncoder().encode(payload),
    });

    console.log(`[send-notification] Push response status: ${response.status}`);

    if (response.status === 201 || response.status === 200) {
      return { success: true, statusCode: response.status };
    }

    const errorText = await response.text();
    console.error(`[send-notification] Push failed: ${response.status} - ${errorText}`);
    return { success: false, statusCode: response.status, error: errorText };
  } catch (error: any) {
    console.error('[send-notification] Push error:', error);
    return { success: false, error: error.message };
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
      console.log('[send-notification] VAPID keys not configured');
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

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { type, ...data },
    });

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const expiredSubscriptionIds: string[] = [];

    // Send notifications to all subscriptions with deduplication
    for (const sub of subscriptions) {
      // Generate deduplication key for this user
      const dedupeKey = generateDedupeKey(type, sub.user_id, data);
      
      // Skip if duplicate
      if (isDuplicate(dedupeKey)) {
        skippedCount++;
        console.log(`[send-notification] Skipped duplicate for user ${sub.user_id}`);
        continue;
      }

      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (result.success) {
        successCount++;
        markSent(dedupeKey); // Mark as sent for deduplication
        console.log(`[send-notification] Sent to user ${sub.user_id}`);
      } else {
        failedCount++;
        console.log(`[send-notification] Failed for user ${sub.user_id}: ${result.error}`);
        
        // Mark expired subscriptions for deletion (410 Gone or 404 Not Found)
        if (result.statusCode === 410 || result.statusCode === 404) {
          expiredSubscriptionIds.push(sub.id);
        }
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
        skipped_duplicates: skippedCount,
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
