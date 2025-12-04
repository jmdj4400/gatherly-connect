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

    // Parse request body for confirmation
    const { confirmEmail } = await req.json();

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

    // Verify email confirmation
    if (confirmEmail !== user.email) {
      console.error('Email confirmation mismatch');
      return new Response(
        JSON.stringify({ success: false, error: 'Email confirmation does not match' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting GDPR account deletion for user: ${user.id}`);

    // Use service role for deletion operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data in order (respecting foreign keys)
    // Note: Some tables have ON DELETE CASCADE, but we'll be explicit

    // 1. Delete messages
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted messages');

    // 2. Delete message read receipts
    await supabaseAdmin
      .from('message_read_receipts')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted message read receipts');

    // 3. Delete group memberships
    await supabaseAdmin
      .from('micro_group_members')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted group memberships');

    // 4. Delete event participations
    await supabaseAdmin
      .from('event_participants')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted event participations');

    // 5. Delete attendance records
    await supabaseAdmin
      .from('attendance_records')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted attendance records');

    // 6. Delete user badges
    await supabaseAdmin
      .from('user_badges')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted user badges');

    // 7. Delete user streaks
    await supabaseAdmin
      .from('user_streaks')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted user streaks');

    // 8. Delete vibe scores
    await supabaseAdmin
      .from('vibe_scores')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted vibe scores');

    // 9. Delete subscriptions
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted subscriptions');

    // 10. Delete community followers
    await supabaseAdmin
      .from('community_followers')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted community followers');

    // 11. Delete push subscriptions
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted push subscriptions');

    // 12. Delete user roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted user roles');

    // 13. Delete no-show predictions
    await supabaseAdmin
      .from('no_show_predictions')
      .delete()
      .eq('user_id', user.id);
    console.log('Deleted no-show predictions');

    // 14. Delete reports (as reporter)
    await supabaseAdmin
      .from('reports')
      .delete()
      .eq('reporter_id', user.id);
    console.log('Deleted reports as reporter');

    // 15. Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);
    console.log('Deleted profile');

    // 16. Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Deleted auth user');

    console.log(`GDPR account deletion completed for user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data have been permanently deleted'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GDPR deletion error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
