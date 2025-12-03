import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subscription, user_id } = await req.json();

    if (!subscription || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing subscription or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[push-subscribe] User ${user_id} subscribing to push notifications`);

    // Upsert subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('[push-subscribe] Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[push-subscribe] Subscription saved for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[push-subscribe] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
