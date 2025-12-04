import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting GDPR data export for user: ${user.id}`);

    // Collect all user data
    const exportData: Record<string, unknown> = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
    };

    // Profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    exportData.profile = profile;

    // Event participations
    const { data: participations } = await supabase
      .from('event_participants')
      .select('*, events(title, starts_at, venue_name)')
      .eq('user_id', user.id);
    exportData.event_participations = participations;

    // Group memberships
    const { data: groupMemberships } = await supabase
      .from('micro_group_members')
      .select('*, micro_groups(event_id, meet_spot, meet_time)')
      .eq('user_id', user.id);
    exportData.group_memberships = groupMemberships;

    // Messages sent
    const { data: messages } = await supabase
      .from('messages')
      .select('content, created_at, group_id')
      .eq('user_id', user.id);
    exportData.messages = messages;

    // User badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*, badge_definitions(name, description)')
      .eq('user_id', user.id);
    exportData.badges = badges;

    // User streaks
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id);
    exportData.streaks = streaks;

    // Subscription data
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    exportData.subscription = subscription;

    // Community follows
    const { data: follows } = await supabase
      .from('community_followers')
      .select('*, orgs(name)')
      .eq('user_id', user.id);
    exportData.community_follows = follows;

    // Attendance records
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', user.id);
    exportData.attendance_records = attendance;

    // Vibe scores
    const { data: vibeScores } = await supabase
      .from('vibe_scores')
      .select('*')
      .eq('user_id', user.id);
    exportData.vibe_scores = vibeScores;

    // User roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*, orgs(name)')
      .eq('user_id', user.id);
    exportData.roles = roles;

    console.log(`GDPR export completed for user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: exportData,
        message: 'Data export completed successfully'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GDPR export error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
