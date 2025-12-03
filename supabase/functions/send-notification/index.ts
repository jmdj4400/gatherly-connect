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
    title: '🎉 Your group is ready!',
    body: 'You\'ve been matched with {count} others for {event}. Say hi!',
  },
  new_message: {
    title: '💬 New message',
    body: '{sender}: {preview}',
  },
  event_starts_24h: {
    title: '📅 Event tomorrow!',
    body: '{event} starts tomorrow. Don\'t forget to meet your group!',
  },
  event_starts_1h: {
    title: '⏰ Starting soon!',
    body: '{event} starts in 1 hour. Time to head out!',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    
    for (const [key, value] of Object.entries(data)) {
      title = title.replace(`{${key}}`, value);
      body = body.replace(`{${key}}`, value);
    }

    // Log notification (in production, you'd send via Web Push API)
    console.log(`[send-notification] type=${type} users=${user_ids.length}`);
    console.log(`[send-notification] title="${title}" body="${body}"`);

    // In production, you would:
    // 1. Fetch push subscriptions for user_ids
    // 2. Use web-push library to send notifications
    // 3. Handle failed deliveries

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent_to: user_ids.length,
        title,
        body,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Send notification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
