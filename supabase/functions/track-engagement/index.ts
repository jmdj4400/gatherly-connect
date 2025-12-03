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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, event_id } = await req.json();

    if (action === 'check_in') {
      // Get event details
      const { data: event, error: eventError } = await supabaseAdmin
        .from('events')
        .select('id, starts_at, host_org_id, category')
        .eq('id', event_id)
        .single();

      if (eventError || !event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check for duplicate check-in
      const { data: existingCheckIn } = await supabaseAdmin
        .from('attendance_records')
        .select('id, checked_in_at')
        .eq('user_id', user.id)
        .eq('event_id', event_id)
        .maybeSingle();

      if (existingCheckIn) {
        console.log(`[track-engagement] Duplicate check-in blocked for user ${user.id} event ${event_id}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Already checked in',
          checked_in_at: existingCheckIn.checked_in_at
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Calculate minutes before start
      const eventStart = new Date(event.starts_at);
      const now = new Date();
      const minutesBefore = Math.round((eventStart.getTime() - now.getTime()) / 60000);

      // Validate check-in window: 30 min before to 60 min after event start
      const minutesAfter = -minutesBefore;
      if (minutesBefore > 30) {
        return new Response(JSON.stringify({ 
          error: 'Check-in not available yet. Come back closer to event time.',
          minutes_until_checkin: minutesBefore - 30
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (minutesAfter > 60) {
        return new Response(JSON.stringify({ 
          error: 'Check-in window has expired. Event started over 1 hour ago.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Record attendance (no upsert since we checked for duplicates)
      const { error: attendanceError } = await supabaseAdmin
        .from('attendance_records')
        .insert({
          user_id: user.id,
          event_id: event.id,
          org_id: event.host_org_id,
          minutes_before_start: minutesBefore
        });

      if (attendanceError) {
        console.error('Attendance error:', attendanceError);
        return new Response(JSON.stringify({ error: 'Failed to record attendance' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[track-engagement] Check-in recorded: user=${user.id}, event=${event_id}, minutes_before=${minutesBefore}`);

      // Update streak if org exists
      if (event.host_org_id) {
        await updateStreak(supabaseAdmin, user.id, event.host_org_id, event.category);
      }

      // Check and award badges
      const newBadges = await checkAndAwardBadges(supabaseAdmin, user.id, event.host_org_id);

      // Add to community feed if new badges earned
      for (const badge of newBadges) {
        await supabaseAdmin.from('community_feed').insert({
          org_id: event.host_org_id,
          feed_type: 'badge_earned',
          user_id: user.id,
          badge_id: badge.id,
          metadata: { badge_name: badge.name, badge_icon: badge.icon }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        new_badges: newBadges.map(b => ({ name: b.name, icon: b.icon }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_user_stats') {
      // Get user's attendance count
      const { count: attendanceCount } = await supabaseAdmin
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get user's streaks
      const { data: streaks } = await supabaseAdmin
        .from('user_streaks')
        .select(`
          current_streak,
          longest_streak,
          category,
          org_id,
          orgs(name)
        `)
        .eq('user_id', user.id)
        .order('current_streak', { ascending: false });

      // Get user's badges
      const { data: badges } = await supabaseAdmin
        .from('user_badges')
        .select(`
          awarded_at,
          badge_definitions(name, description, icon, slug)
        `)
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        attendance_count: attendanceCount || 0,
        streaks: streaks || [],
        badges: badges?.map(b => ({
          ...(b.badge_definitions as any),
          awarded_at: b.awarded_at
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Track engagement error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function updateStreak(supabase: any, userId: string, orgId: string, category: string | null) {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Get existing streak
  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('category', category || '')
    .maybeSingle();

  if (!existing) {
    // Create new streak
    await supabase.from('user_streaks').insert({
      user_id: userId,
      org_id: orgId,
      category: category || null,
      current_streak: 1,
      longest_streak: 1,
      last_attendance_week: currentWeek,
      last_attendance_year: currentYear
    });
    return;
  }

  // Check if this is the same week
  if (existing.last_attendance_week === currentWeek && existing.last_attendance_year === currentYear) {
    return; // Already counted this week
  }

  // Check if this is consecutive (last week or within same year boundary)
  const isConsecutive = (
    (existing.last_attendance_year === currentYear && existing.last_attendance_week === currentWeek - 1) ||
    (existing.last_attendance_year === currentYear - 1 && existing.last_attendance_week >= 52 && currentWeek === 1)
  );

  const newStreak = isConsecutive ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(existing.longest_streak, newStreak);

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_attendance_week: currentWeek,
      last_attendance_year: currentYear,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id);
}

async function checkAndAwardBadges(supabase: any, userId: string, orgId: string | null): Promise<any[]> {
  const newBadges: any[] = [];

  // Get all badge definitions
  const { data: definitions } = await supabase
    .from('badge_definitions')
    .select('*');

  if (!definitions) return newBadges;

  // Get user's existing badges
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(existingBadges?.map((b: any) => b.badge_id) || []);

  // Get attendance count
  const { count: attendanceCount } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get early arrivals count (15+ min early)
  const { count: earlyCount } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('minutes_before_start', 15);

  // Get max streak
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .order('current_streak', { ascending: false })
    .limit(1);

  const maxStreak = streakData?.[0]?.current_streak || 0;

  // Check each badge
  for (const badge of definitions) {
    if (existingBadgeIds.has(badge.id)) continue;

    let earned = false;

    switch (badge.requirement_type) {
      case 'attendance':
        earned = (attendanceCount || 0) >= badge.requirement_count;
        break;
      case 'streak':
        earned = maxStreak >= badge.requirement_count;
        break;
      case 'early_arrival':
        earned = (earlyCount || 0) >= badge.requirement_count;
        break;
    }

    if (earned) {
      const { error } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
        org_id: orgId
      });

      if (!error) {
        newBadges.push(badge);
        console.log(`Awarded badge ${badge.name} to user ${userId}`);
      }
    }
  }

  return newBadges;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}