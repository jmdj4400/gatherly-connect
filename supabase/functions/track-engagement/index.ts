import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ErrorCodes = {
  AUTH: 'E.AUTH',
  ATTENDANCE: 'E.ATTENDANCE',
  NOT_FOUND: 'E.NOT_FOUND',
  DUPLICATE: 'E.DUPLICATE',
  VALIDATION: 'E.VALIDATION',
  UNKNOWN: 'E.UNKNOWN',
} as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHECK_IN_WINDOW_BEFORE = 30; // minutes
const CHECK_IN_WINDOW_AFTER = 60;  // minutes

function successResponse<T>(data: T) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status = 400, details?: any) {
  console.error(`[track-engagement] ${code}: ${message}`);
  return new Response(JSON.stringify({ success: false, error: { code, message, details } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

function generateStreakHash(userId: string, orgId: string, week: number, year: number): string {
  return `${userId}-${orgId}-${year}-${week}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(ErrorCodes.AUTH, 'No authorization header', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return errorResponse(ErrorCodes.AUTH, 'Unauthorized', 401);
    }

    const { action, event_id } = await req.json();

    if (action === 'check_in') {
      if (!event_id) {
        return errorResponse(ErrorCodes.VALIDATION, 'event_id is required');
      }

      // Get event details
      const { data: event, error: eventError } = await supabaseAdmin
        .from('events')
        .select('id, starts_at, host_org_id, category')
        .eq('id', event_id)
        .single();

      if (eventError || !event) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Event not found', 404);
      }

      // DUPLICATE CHECK - with unique constraint backup
      const { data: existingCheckIn } = await supabaseAdmin
        .from('attendance_records')
        .select('id, checked_in_at')
        .eq('user_id', user.id)
        .eq('event_id', event_id)
        .maybeSingle();

      if (existingCheckIn) {
        console.log(`[attendance] duplicate_blocked: user=${user.id}, event=${event_id}`);
        return errorResponse(ErrorCodes.DUPLICATE, 'Already checked in', 400, {
          checked_in_at: existingCheckIn.checked_in_at
        });
      }

      // ATTENDANCE WINDOW VALIDATION
      const eventStart = new Date(event.starts_at);
      const now = new Date();
      const minutesBefore = Math.round((eventStart.getTime() - now.getTime()) / 60000);
      const minutesAfter = -minutesBefore;

      if (minutesBefore > CHECK_IN_WINDOW_BEFORE) {
        console.log(`[attendance] window_too_early: user=${user.id}, event=${event_id}, minutes_before=${minutesBefore}`);
        return errorResponse(ErrorCodes.ATTENDANCE, 'Check-in not available yet. Come back closer to event time.', 400, {
          minutes_until_checkin: minutesBefore - CHECK_IN_WINDOW_BEFORE
        });
      }

      if (minutesAfter > CHECK_IN_WINDOW_AFTER) {
        console.log(`[attendance] window_expired: user=${user.id}, event=${event_id}, minutes_after=${minutesAfter}`);
        return errorResponse(ErrorCodes.ATTENDANCE, 'Check-in window has expired. Event started over 1 hour ago.');
      }

      // Record attendance
      const { error: attendanceError } = await supabaseAdmin
        .from('attendance_records')
        .insert({
          user_id: user.id,
          event_id: event.id,
          org_id: event.host_org_id,
          minutes_before_start: minutesBefore
        });

      if (attendanceError) {
        // Handle unique constraint violation (race condition backup)
        if (attendanceError.code === '23505') {
          return errorResponse(ErrorCodes.DUPLICATE, 'Already checked in');
        }
        console.error('[track-engagement] Attendance error:', attendanceError);
        return errorResponse(ErrorCodes.UNKNOWN, 'Failed to record attendance', 500);
      }

      // Update event_participants attendance status
      await supabaseAdmin
        .from('event_participants')
        .update({
          attendance_status: 'checked_in',
          attendance_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('event_id', event_id);

      console.log(`[analytics] check_in: user=${user.id}, event=${event_id}, minutes_before=${minutesBefore}`);

      // Update streak with idempotency
      if (event.host_org_id) {
        await updateStreakWithIdempotency(supabaseAdmin, user.id, event.host_org_id, event.category);
      }

      // Check and award badges
      const newBadges = await checkAndAwardBadges(supabaseAdmin, user.id, event.host_org_id);

      // Add to community feed if badges earned
      for (const badge of newBadges) {
        await supabaseAdmin.from('community_feed').insert({
          org_id: event.host_org_id,
          feed_type: 'badge_earned',
          user_id: user.id,
          badge_id: badge.id,
          metadata: { badge_name: badge.name, badge_icon: badge.icon }
        });
        console.log(`[analytics] badge_earned: user=${user.id}, badge=${badge.slug}`);
      }

      return successResponse({ 
        checked_in: true,
        minutes_before_start: minutesBefore,
        new_badges: newBadges.map(b => ({ name: b.name, icon: b.icon }))
      });
    }

    if (action === 'get_user_stats') {
      const { count: attendanceCount } = await supabaseAdmin
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: streaks } = await supabaseAdmin
        .from('user_streaks')
        .select(`current_streak, longest_streak, category, org_id, orgs(name)`)
        .eq('user_id', user.id)
        .order('current_streak', { ascending: false });

      const { data: badges } = await supabaseAdmin
        .from('user_badges')
        .select(`awarded_at, badge_definitions(name, description, icon, slug)`)
        .eq('user_id', user.id);

      return successResponse({
        attendance_count: attendanceCount || 0,
        streaks: streaks || [],
        badges: badges?.map(b => ({
          ...(b.badge_definitions as any),
          awarded_at: b.awarded_at
        })) || []
      });
    }

    return errorResponse(ErrorCodes.VALIDATION, 'Invalid action');

  } catch (error) {
    console.error('[track-engagement] Error:', error);
    return errorResponse(ErrorCodes.UNKNOWN, 'Internal server error', 500);
  }
});

async function updateStreakWithIdempotency(
  supabase: any, 
  userId: string, 
  orgId: string, 
  category: string | null
) {
  const { week, year } = getWeekNumber(new Date());
  const updateHash = generateStreakHash(userId, orgId, week, year);

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('category', category || null)
    .maybeSingle();

  // IDEMPOTENCY CHECK
  if (existing?.last_update_hash === updateHash) {
    console.log(`[attendance] streak_idempotency_hit: hash=${updateHash}`);
    return;
  }

  if (!existing) {
    await supabase.from('user_streaks').insert({
      user_id: userId,
      org_id: orgId,
      category: category || null,
      current_streak: 1,
      longest_streak: 1,
      last_attendance_week: week,
      last_attendance_year: year,
      last_update_hash: updateHash
    });
    console.log(`[analytics] streak_started: user=${userId}, org=${orgId}`);
    return;
  }

  const isConsecutive = (
    (existing.last_attendance_year === year && existing.last_attendance_week === week - 1) ||
    (existing.last_attendance_year === year - 1 && existing.last_attendance_week >= 52 && week === 1)
  );

  const newStreak = isConsecutive ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(existing.longest_streak, newStreak);

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_attendance_week: week,
      last_attendance_year: year,
      last_update_hash: updateHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id);

  console.log(`[analytics] streak_updated: user=${userId}, streak=${newStreak}, longest=${newLongest}`);
}

async function checkAndAwardBadges(supabase: any, userId: string, orgId: string | null): Promise<any[]> {
  const newBadges: any[] = [];

  const { data: definitions } = await supabase.from('badge_definitions').select('*');
  if (!definitions) return newBadges;

  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(existingBadges?.map((b: any) => b.badge_id) || []);

  const { count: attendanceCount } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: earlyCount } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('minutes_before_start', 15);

  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .order('current_streak', { ascending: false })
    .limit(1);

  const maxStreak = streakData?.[0]?.current_streak || 0;

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
      }
    }
  }

  return newBadges;
}
